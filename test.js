const isOdd = require('is-odd');

// Test regular numbers
console.log('1 is odd:', isOdd(1));  // true
console.log('2 is odd:', isOdd(2));  // false

// Test zero - should throw an error after we patch
try {
  const result = isOdd(0);
  console.log('0 is odd:', result);
} catch (error) {
  console.log('Error with 0:', error.message);
}