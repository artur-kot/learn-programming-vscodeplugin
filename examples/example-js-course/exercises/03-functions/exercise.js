// TODO: Complete the following functions

// 1. Create a function that adds two numbers
function add(a, b) {
  return a + b;
}

// 2. Create a function that multiplies two numbers
function multiply(a, b) {
  return a * b;
}

// 3. Create a function that checks if a number is even
function isEven(num) {
  return num % 2 === 0;
}

// 4. Create a function that returns the larger of two numbers
function max(a, b) {
  return a > b ? a : b;
}

module.exports = { add, multiply, isEven, max };
