# Exercise 2: Variables and Data Types

Now that you've created your first function, let's explore variables and different data types in JavaScript!

## Learning Objectives

- Declare variables using `const` and `let`
- Understand primitive data types: strings, numbers, and booleans
- Use variables in functions

## Instructions

Open the `exercise.js` file and:

1. Set the `myName` variable to your name (as a string)
2. Set the `myAge` variable to your age (as a number)
3. Set the `isStudent` variable to `true` or `false`
4. Complete the `introduce` function to return a formatted introduction string

## Requirements

- `myName` must be a non-empty string
- `myAge` must be a positive number
- `isStudent` must be a boolean (`true` or `false`)
- `introduce()` should return a string like: `"Hi, I'm Alice, I'm 25 years old"`

## Example

```javascript
const myName = "Alice";
const myAge = 25;

function introduce() {
  return "Hi, I'm " + myName + ", I'm " + myAge + " years old";
}
```

## Tips

- Strings can be concatenated with the `+` operator
- You can also use template literals with backticks: `` `Hi, I'm ${myName}` ``
- Make sure your variables are defined before using them in the function

Good luck! 🎯
