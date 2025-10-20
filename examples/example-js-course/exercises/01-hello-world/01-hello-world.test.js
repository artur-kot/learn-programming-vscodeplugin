const { sayHello } = require('./exercise');

describe('Hello World Exercise', () => {
  test('sayHello should return "Hello, World!"', () => {
    expect(sayHello()).toBe('Hello, World!');
  });

  test('sayHello should be a function', () => {
    expect(typeof sayHello).toBe('function');
  });
});
