// Clear the module cache to ensure we get the latest version
if (require.cache[require.resolve('is-odd')]) {
  delete require.cache[require.resolve('is-odd')];
}

console.log('Testing is-odd with value 0:');
const isOdd = require('is-odd');

try {
  const result = isOdd(0);
  console.log('Result:', result);
} catch (error) {
  console.log('Error caught:', error.message);
}