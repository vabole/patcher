import { isEven } from './index.js';

// Test cases
const testCases = [
  { input: 0, expected: true },
  { input: 1, expected: false },
  { input: 2, expected: true },
  { input: 3, expected: false },
  { input: -4, expected: true },
  { input: -5, expected: false }
];

// Run tests
let passed = 0;
let failed = 0;

for (const test of testCases) {
  const result = isEven(test.input);
  if (result === test.expected) {
    console.log(`✓ isEven(${test.input}) === ${test.expected}`);
    passed++;
  } else {
    console.error(`✗ isEven(${test.input}) returned ${result}, expected ${test.expected}`);
    failed++;
  }
}

console.log(`\nTest results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}