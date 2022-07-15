export default () => {
  const prediction = Math.floor(Math.random() * 2) === 1 ? 'RED' : 'GREEN';
  const confidence = Math.random();

  return { prediction, confidence }
}