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

  const onSubmit = () => {
    const res = generateDummyData();
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

  const calculateResultColor = (includeTransparancy) => {
    if (!results.prediction) return null;
    let backgroundColor = COLORS[results.prediction];
    if (includeTransparancy) backgroundColor += '08';
    return { backgroundColor };
  };

  const determineHeaderText = () => {
    if (!results.prediction || !results.confidence) return 'Is it normal?';
    let header = 'We are fairly confident that the status is';
    if (results.confidence > .80) header = 'We are very confident that the status is';
    if (results.confidence < .20) header = 'There is a slight chance that the status is';
    if (results.prediction === 'RED') header += ' abnormal.';
    if (results.prediction === 'GREEN') header += ' normal.';
    return header;
  };

  return (
    <div className="anomoly-detection-fe" style={calculateResultColor(true)}>
      <div className="form">
        <h1>{determineHeaderText()}</h1>
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
        <div className="thermometer__stem">
          <div
            className="thermometer__confidence-measurement"
            style={calculateConfidenceStyle()}
          />
        </div>
        <div className="thermometer__bulb" style={calculateResultColor()} />
      </div>
      <button onClick={onReset} className="reset-button">
        Reset
      </button>
    </div>
  );
};

export default App;
