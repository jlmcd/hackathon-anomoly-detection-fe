import { useState } from 'react';
import './app.css';
import generateDummyData from './dummyDataGenerator';

const COLORS = {
  WHITE: '#E6EBE0',
  PURPLE: '#301A4B',
  RED: '#F39A9D',
  GREEN: '#3F6C51',
  BLUE: '#15616D',
};

const App = () => {
  const [inputValue, setInputValue] = useState(0);
  const [results, setResults] = useState({
    prediction: null,
    confidence: null,
  });

  const onValueChange = (evt) => {
    evt.preventDefault();
    const newValue = Number(evt.target.value);
    if (Number.isNaN(newValue) || typeof newValue === 'string') return;
    if (typeof newValue === 'number') setInputValue(Math.abs(newValue));
  };

  const onSubmit = () => {
    const res = generateDummyData();
    setResults(res);
  };

  const calculateConfidenceStyle = () => {
    if (!results.prediction || !results.confidence) return null;
    return {
      height: `${results.confidence * 100}%`,
      backgroundColor: COLORS[results.prediction],
    };
  };

  const calculateResultColor = (isBackground) => {
    if (!results.prediction) return null;
    let backgroundColor = COLORS[results.prediction];
    if (isBackground) backgroundColor += '33'
    return { backgroundColor };
  };

  return (
    <div className="anomoly-detection-fe" style={calculateResultColor(true)}>
      <div className="form">
        <h1>Is it normal?</h1>
        <input onChange={onValueChange} type="number" value={inputValue} />
        <button onClick={onSubmit}>Predict</button>
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
    </div>
  );
};

export default App;
