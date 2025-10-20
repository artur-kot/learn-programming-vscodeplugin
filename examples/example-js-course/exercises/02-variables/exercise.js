// TODO: Create the following variables with the correct values

// 1. Create a variable named 'myName' with your name as a string
const myName = "Artur";

// 2. Create a variable named 'myAge' with your age as a number
const myAge = 30;

// 3. Create a variable named 'isStudent' with a boolean value
const isStudent = true;

// 4. Create a function named 'introduce' that returns a string in the format:
//    "Hi, I'm [name], I'm [age] years old"
function introduce() {
  return `Hi, I'm ${myName}, I'm ${myAge} years old`;
}

module.exports = { myName, myAge, isStudent, introduce };
