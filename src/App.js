import { useState } from 'react';
import './app.css';
import generateDummyData from './dummyDataGenerator';

const WHITE = '#E6EBE0';
const PURPLE = '#301A4B';
const RED = '#F39A9D';
const GREEN = '#3F6C51';
const BLUE = '#15616D';

const App = () => {
  const [inputValue, setInputValue] = useState(0);
  const [results, setResults] = useState({prediction: null, confidence: null});

  const onValueChange = (evt) => {
    evt.preventDefault();
    const newValue = Number(evt.target.value);
    if (Number.isNaN(newValue) || typeof newValue === 'string') return;
    if (typeof newValue === 'number') setInputValue(newValue);
  };

  const onSubmit = () => {
    const res = generateDummyData();
    setResults(res);
  };

  return (
    <div className="anomoly-detection-fe">
      <div className="form">
        <h1>Is it normal?</h1>
        <input onChange={onValueChange} type="number" value={inputValue} />
        <button onClick={onSubmit}>Predict</button>
      </div>
      <div className="thermometer-container">
        <div className="thermometer__stem"></div>
        <div className="thermometer__bulb"></div>
      </div>
    </div>
  );
};

export default App;
