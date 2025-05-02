#!/usr/bin/env node

import validator from 'validator';

console.log('=== Testing validator before patching ===');
console.log('');

try {
  // This will throw an error with the default message
  validator.isEmail(123);
} catch (error) {
  console.log('Original error message:', error.message);
}

console.log('');
console.log('To patch validator with a more friendly error message:');
console.log('patcher validator-error-message.js');
console.log('');
console.log('After patching, the error message would be more user-friendly');
console.log('');

// Example output of what the patched version would show
console.log('Patched error would be: "Validation failed: Please provide a valid text value instead of a Number"');
console.log('');
console.log('To undo the patch:');
console.log('patcher --undo validator-error-message.js');