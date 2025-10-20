const { add, multiply, isEven, max } = require('./exercise');

describe('Functions Exercise', () => {
  describe('add function', () => {
    test('should add two positive numbers', () => {
      expect(add(2, 3)).toBe(5);
      expect(add(10, 5)).toBe(15);
    });

    test('should handle negative numbers', () => {
      expect(add(-5, 3)).toBe(-2);
      expect(add(-10, -5)).toBe(-15);
    });
  });

  describe('multiply function', () => {
    test('should multiply two numbers', () => {
      expect(multiply(2, 3)).toBe(6);
      expect(multiply(5, 4)).toBe(20);
    });

    test('should handle zero', () => {
      expect(multiply(5, 0)).toBe(0);
    });
  });

  describe('isEven function', () => {
    test('should return true for even numbers', () => {
      expect(isEven(2)).toBe(true);
      expect(isEven(100)).toBe(true);
    });

    test('should return false for odd numbers', () => {
      expect(isEven(3)).toBe(false);
      expect(isEven(99)).toBe(false);
    });
  });

  describe('max function', () => {
    test('should return the larger number', () => {
      expect(max(5, 3)).toBe(5);
      expect(max(10, 20)).toBe(20);
    });

    test('should handle equal numbers', () => {
      expect(max(5, 5)).toBe(5);
    });

    test('should handle negative numbers', () => {
      expect(max(-5, -10)).toBe(-5);
    });
  });
});
