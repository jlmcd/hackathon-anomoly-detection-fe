import { useState } from 'react';
import './app.css';
import generateDummyData from './dummyDataGenerator';

const COLORS = {
  WHITE: '#E6EBE0',
  PURPLE: '#301A4B',
  RED: '#F34213',
  GREEN: '#3F6C51',
  BLUE: '#15616D',
};

const App = () => {
  const [inputValue, setInputValue] = useState(0);
  const [results, setResults] = useState({
    prediction: null,
    confidence: null,
  });

  const onReset = () => {
    setResults({
      prediction: null,
      confidence: null,
    });
    setInputValue(0);
  };

  const onSubmit = async () => {
    const res = await fetch('http://localhost:1337/prediction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: {something: 'value'}
    });
    // const res = await fetch('http://localhost:1337/prediction', {
    //   method: 'POST',
    //   // headers: {
    //   //   'Content-Type': 'application/json',
    //   // },
    //   // body: JSON.stringify({sample: [2, 10, 89]}),
    // });
    setResults(res);
  };

  const onValueChange = (evt) => {
    evt.preventDefault();
    const newValue = Number(evt.target.value);
    if (Number.isNaN(newValue) || typeof newValue === 'string') return;
    if (typeof newValue === 'number') setInputValue(Math.abs(newValue));
  };

  const calculateConfidenceStyle = () => {
    if (!results.prediction || !results.confidence) return null;
    return {
      height: `${results.confidence * 100}%`,
      backgroundColor: COLORS[results.prediction],
    };
  };

  const calculateResultColor = (includeTransparancy, includeTextColor) => {
    if (!results.prediction) return null;
    let backgroundColor = COLORS[results.prediction];
    if (includeTransparancy) backgroundColor += '08';
    const color =
      includeTextColor && results.prediction === 'GREEN' ? 'white' : '';
    return { backgroundColor, color };
  };

  const determineHeaderConfidence = () => {
    if (!results.prediction || !results.confidence) return 'Is it normal?';
    let header = 'We are fairly confident that this volume is';
    if (results.confidence > 0.8)
      header = 'We are very confident that this volume is';
    if (results.confidence < 0.2)
      header = 'There is a slight chance that this volume is';
    return header;
  };

  const determineHeaderPrediction = () => {
    if (!results.prediction || !results.confidence) return null;
    if (results.prediction === 'RED') return ' abnormal.';
    if (results.prediction === 'GREEN') return ' normal.';
  };

  return (
    <div className="anomoly-detection-fe" style={calculateResultColor(true)}>
      <div className="content">
        <div className="form">
          <h1>
            {determineHeaderConfidence()}{' '}
            <span style={calculateResultColor(false, true)}>
              {determineHeaderPrediction()}
            </span>
          </h1>
          <input onChange={onValueChange} type="number" value={inputValue} />
          <button
            className="predict-button"
            onClick={onSubmit}
            style={calculateResultColor(true)}
          >
            Predict
          </button>
        </div>
        <div className="thermometer-container">
          <h2>Confidence Meter</h2>
          <div className="thermometer__stem">
            <div
              className="thermometer__confidence-measurement"
              style={calculateConfidenceStyle()}
            >
              {results.confidence && (
                <div className="thermometer__confidence-label">
                  {Math.round(results?.confidence * 100)}%
                </div>
              )}
            </div>
          </div>
          <div className="thermometer__bulb" style={calculateResultColor()} />
        </div>
        <button onClick={onReset} className="reset-button">
          Reset
        </button>
      </div>
    </div>
  );
};

export default App;
