/**
 * @license
 * Copyright 2019 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */
require('@tensorflow/tfjs-node');

const http = require('http');
const socketio = require('socket.io');
const PORT = 8001;

const tf = require('@tensorflow/tfjs');
const { format } = require('path');
const { log } = require('console');

const TRAIN_DATA_PATH =
    'https://utility.client-uat.localsearchprofiles.com/training_data.csv';
const TEST_DATA_PATH =
    'https://utility.client-uat.localsearchprofiles.com/test_data.csv';

// Constants from training data:

const DAY_WEEK_MIN = 1;
const DAY_WEEK_MAX = 7;
const DAY_MONTH_MIN = 1;
const DAY_MONTH_MAX = 31;
const VALUE_MIN = 0;
const VALUE_MAX = 267;


const NUM_CLASSES = 2;
const TRAINING_DATA_LENGTH = 476;
const TEST_DATA_LENGTH = 204;


// Normalize a value between a given range.
function normalize(value, min, max) {
  if (min === undefined || max === undefined) {
    return value;
  }
  return (value - min) / (max - min);
}

// Sleeps for a given ms.
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


const csvTransform =
    ({xs, ys}) => {
      const values = [
        normalize(xs.day_of_week, DAY_WEEK_MIN, DAY_WEEK_MAX),
        normalize(xs.day_of_month, DAY_MONTH_MIN, DAY_MONTH_MAX),
        normalize(xs.value, VALUE_MIN, VALUE_MAX)
      ];
      return {xs: values, ys: ys.status};
    }

const trainingData =
    tf.data.csv(TRAIN_DATA_PATH, {columnConfigs: {status: {isLabel: true}}})
        .map(csvTransform)
        .shuffle(TRAINING_DATA_LENGTH)
        .batch(100);

  
// Load all training data in one batch to use for eval:
const trainingValidationData =
    tf.data.csv(TRAIN_DATA_PATH, {columnConfigs: {status: {isLabel: true}}})
        .map(csvTransform)
        .batch(TRAINING_DATA_LENGTH);


const testValidationData =
    tf.data.csv(TEST_DATA_PATH, {columnConfigs: {status: {isLabel: true}}})
        .map(csvTransform)
        .batch(TEST_DATA_LENGTH);


const model = tf.sequential();
model.add(tf.layers.dense({units: 20, activation: 'relu', inputShape: [3]}));
model.add(tf.layers.dense({units: 10, activation: 'relu'}));
model.add(tf.layers.dense({units: 10, activation: 'relu'}));
model.add(tf.layers.dense({units: NUM_CLASSES, activation: 'softmax'}));
model.compile({
  optimizer: tf.train.adam(),
  loss: 'sparseCategoricalCrossentropy',
  metrics: ['accuracy']
});


// Returns pitch class evaluation percentages for training data
// with an option to include test data
async function evaluate(useTestData) {
  let results = {};
  await trainingValidationData.forEachAsync(pitchTypeBatch => {
    const values = model.predict(pitchTypeBatch.xs).dataSync();
    const classSize = TRAINING_DATA_LENGTH / NUM_CLASSES;
    for (let i = 0; i < NUM_CLASSES; i++) {
      results[statusFromClassNum(i)] = {
        training: calcClassEval(i, classSize, values)
      };
    }
  });

  if (useTestData) {
    await testValidationData.forEachAsync(pitchTypeBatch => {
      const values = model.predict(pitchTypeBatch.xs).dataSync();
      const classSize = TEST_DATA_LENGTH / NUM_CLASSES;
      for (let i = 0; i < NUM_CLASSES; i++) {
        results[statusFromClassNum(i)].validation =
            calcClassEval(i, classSize, values);
      }
    });
  }
  return results;
}


async function predictSample(sample) {
  let result = model.predict(tf.tensor(sample, [1,sample.length])).arraySync();
  console.log(result);
  var maxValue = 0;
  var predictedPitch = 2;
  for (var i = 0; i < NUM_CLASSES; i++) {
    if (result[0][i] > maxValue) {
      predictedPitch = i;
    }
  }

  return statusFromClassNum(predictedPitch);
}

// Determines accuracy evaluation for a given pitch class by index
function calcClassEval(pitchIndex, classSize, values) {

  let index = (pitchIndex * classSize * NUM_CLASSES) + pitchIndex;
  let total = 0;
  for (let i = 0; i < classSize; i++) {
    total += values[index];
    index += NUM_CLASSES;
  }

  return total / classSize;
}

function statusFromClassNum(classNum) {
  switch (classNum) {
    case 0:
      return 'Green';
    case 1:
      return 'Red';
    default:
      return 'Unknown';
  }
}


async function run() {
  const port = process.env.PORT || PORT;
  const server = http.createServer();
  const io = socketio(server);

  server.listen(port, () => {
    console.log(`  > Running socket on port: ${port}`);
  });

  io.on('connection', (socket) => {
    socket.on('predictSample', async (sample) => {
      console.log("somethiing")
      io.emit('predictResult', await predictSample(sample));
    });
  });

  let numTrainingIterations = 4;
  const TIMEOUT_BETWEEN_EPOCHS_MS = 500;
  for (var i = 0; i < numTrainingIterations; i++) {
      console.log(`Training iteration : ${i + 1} / ${numTrainingIterations}`);
      await model.fitDataset(trainingData, { epochs: 1 });
      await evaluate(true);
      await sleep(TIMEOUT_BETWEEN_EPOCHS_MS);
  }

  io.emit('trainingComplete', true);
}

run();
