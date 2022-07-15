const express = require('express');
const PORT = 1337;

require('@tensorflow/tfjs-node');

const tf = require('@tensorflow/tfjs');

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
  // TODO(kreeger): Consider using model.evaluateDataset()
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
  if (!sample || !sample.length) return null;
  let result = model.predict(tf.tensor(sample, [1,sample.length])).arraySync();
  var maxValue = 0;
  var classNumber = 2;
  for (var i = 0; i < NUM_CLASSES; i++) {
    if (result[0][i] > maxValue) {
      classNumber = i;
    }
  }
  return statusFromClassNum(classNumber);
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


// async function run() {
//   let numTrainingIterations = 30;
//   const TIMEOUT_BETWEEN_EPOCHS_MS = 500;
//   for (var i = 0; i < numTrainingIterations; i++) {
//       console.log(`Training iteration : ${i + 1} / ${numTrainingIterations}`);
//       await model.fitDataset(trainingData, { epochs: 1 });
//       await evaluate(true);
//       await sleep(TIMEOUT_BETWEEN_EPOCHS_MS);
//   }


//   await predictSample([1,18,20,]);  // RED
//   await predictSample([2,19,130,]); // GREEN
//   await predictSample([3,20,140,]); // GREEN
//   await predictSample([4,21,160,]); // GREEN
//   await predictSample([5,15,10,]);  // RED
//   await predictSample([6,16,150,]); // GREEN
//   await predictSample([7,17,10,]);  // RED

// }

const app = express();
app.use(express.json());

app.post('/prediction', (req, res) => {
  console.log('req.body', req.body);
  // predictSample(req.body)
  console.log('HTIEWHOIHTOEIWHT')
  res.status(200).send('Hello World!')
})

app.listen(PORT, async () => {
  let numTrainingIterations = 1;
  const TIMEOUT_BETWEEN_EPOCHS_MS = 500;
  for (var i = 0; i < numTrainingIterations; i++) {
      console.log(`Training iteration : ${i + 1} / ${numTrainingIterations}`);
      await model.fitDataset(trainingData, { epochs: 1 });
      await evaluate(true);
      await sleep(TIMEOUT_BETWEEN_EPOCHS_MS);
  }
  console.log(`Listening on port ${PORT}`);
})