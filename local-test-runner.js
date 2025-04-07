console.log('Testing is-odd with value 0:');

try {
  // Using dynamic import since we're testing a CommonJS package
  const isOddModule = await import('is-odd');
  const isOdd = isOddModule.default;
  
  const result = isOdd(0);
  console.log('Result:', result);
} catch (error) {
  console.log('Error caught:', error.message);
}