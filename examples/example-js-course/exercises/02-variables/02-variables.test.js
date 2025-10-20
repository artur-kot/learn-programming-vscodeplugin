const { myName, myAge, isStudent, introduce } = require('./exercise');

describe('Variables Exercise', () => {
  test('myName should be a non-empty string', () => {
    expect(typeof myName).toBe('string');
    expect(myName.length).toBeGreaterThan(0);
  });

  test('myAge should be a positive number', () => {
    expect(typeof myAge).toBe('number');
    expect(myAge).toBeGreaterThan(0);
  });

  test('isStudent should be a boolean', () => {
    expect(typeof isStudent).toBe('boolean');
  });

  test('introduce should return a formatted string', () => {
    const result = introduce();
    expect(typeof result).toBe('string');
    expect(result).toContain(myName);
    expect(result).toContain(myAge.toString());
  });
});
