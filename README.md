# Learn Programming - VS Code Extension

An interactive programming learning extension for Visual Studio Code with AI-powered hints, progressive exercises, and multi-language support.

## Features

- **Interactive Learning**: Complete programming exercises directly in VS Code
- **Progressive Unlocking**: Exercises unlock as you complete previous ones
- **Multi-Language Support**: JavaScript, Python, Go, and Rust
- **AI-Powered Hints**: Get contextual hints from Ollama when you're stuck
- **Real-Time Feedback**: See test results instantly with streaming output
- **Progress Tracking**: Your progress is saved automatically
- **Rich Instructions**: Beautiful webview panels with formatted exercise descriptions

## Installation

### From VS Code Marketplace

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "Learn Programming"
4. Click Install

### From VSIX File

1. Download the `.vsix` file from releases
2. Open VS Code
3. Go to Extensions
4. Click the "..." menu → "Install from VSIX..."
5. Select the downloaded file

## Getting Started

### 1. Create or Open a Course

A course is a workspace folder containing a `course.json` file. You can:

- Use the example course in `examples/javascript-basics/`
- Create your own course (see Course Structure below)

### 2. Open the Workspace

```bash
code examples/javascript-basics/
```

The extension will activate automatically when it detects a `course.json` file.

### 3. Start Learning

1. Open the "Learn Programming" view in the sidebar (book icon)
2. Click on the first exercise
3. Read the instructions in the webview panel
4. Edit the exercise file
5. Click "Run Tests" to check your solution
6. Get AI hints if you need help

## Course Structure

```
my-course/
├── course.json              # Course metadata
├── package.json             # Dependencies (for JavaScript/Node.js)
└── exercises/
    ├── 01-first-exercise/
    │   ├── exercise.js      # Exercise file (student edits this)
    │   ├── 01-first-exercise.test.js  # Test file
    │   └── README.md        # Exercise instructions
    ├── 02-second-exercise/
    │   ├── exercise.js
    │   ├── 02-second-exercise.test.js
    │   └── README.md
    └── ...
```

### course.json Format

```json
{
  "name": "Course Name",
  "description": "Course description",
  "author": "Your Name",
  "version": "1.0.0",
  "language": "javascript",
  "exercises": [
    {
      "id": "01-hello-world",
      "title": "Hello World",
      "description": "Your first exercise",
      "order": 1
    }
  ]
}
```

Supported languages: `javascript`, `python`, `go`, `rust`

## Configuration

Access settings via: File → Preferences → Settings → Search "Learn Programming"

### Available Settings

- **learnProgramming.ollamaUrl** (default: `http://localhost:11434`)
  - URL for Ollama API

- **learnProgramming.ollamaModel** (default: `llama2`)
  - AI model to use for hints

- **learnProgramming.enableHints** (default: `true`)
  - Enable/disable AI-powered hints

- **learnProgramming.autoOpenExercise** (default: `true`)
  - Automatically open exercise file when selected

- **learnProgramming.showTestOutputInTerminal** (default: `false`)
  - Show test output in terminal instead of output channel

## Using AI Hints

This extension supports AI-powered hints via [Ollama](https://ollama.ai).

### Setup Ollama

1. Install Ollama: https://ollama.ai/download
2. Pull a model: `ollama pull llama2`
3. Start Ollama (usually runs automatically)
4. Configure the extension settings if needed

### Getting a Hint

1. Run tests on an exercise (they must fail first)
2. Click "Get Hint" button
3. The AI will analyze your code and provide guidance

## Commands

All commands are available via Command Palette (Ctrl+Shift+P / Cmd+Shift+P):

- **Learn Programming: Open Course** - Reload course data
- **Learn Programming: Run Tests** - Run tests for current exercise
- **Learn Programming: Get Hint** - Generate AI hint
- **Learn Programming: Next Exercise** - Go to next unlocked exercise
- **Learn Programming: Previous Exercise** - Go to previous exercise
- **Learn Programming: Reset Progress** - Clear all progress (cannot be undone)
- **Learn Programming: Refresh** - Refresh exercise tree view

## Creating Your Own Course

### 1. Initialize Course Directory

```bash
mkdir my-course
cd my-course
```

### 2. Create course.json

See structure above. Choose your language: `javascript`, `python`, `go`, or `rust`.

### 3. Create Exercises

For each exercise, create a directory with:
- Exercise file (where students write code)
- Test file (validates the solution)
- README.md (instructions)

### 4. Setup Test Framework

**JavaScript (Jest):**
```bash
npm init -y
npm install --save-dev jest
```

Add to `package.json`:
```json
{
  "scripts": {
    "test": "jest"
  }
}
```

**Python (pytest):**
```bash
pip install pytest
```

**Go:**
Uses built-in `go test`

**Rust:**
Uses built-in `cargo test`

### 5. Test Your Course

Open the course directory in VS Code and the extension will load it automatically.

## Language-Specific Notes

### JavaScript
- Uses Jest for testing
- Exercise files typically named `exercise.js`
- Test files: `[exercise-id].test.js`

### Python
- Uses pytest
- Exercise files typically named `exercise.py`
- Test files: `test_[exercise-id].py`

### Go
- Uses `go test`
- Exercise files typically named `exercise.go`
- Test files: `[exercise-id]_test.go`

### Rust
- Uses `cargo test`
- Exercise files in `src/` directory
- Test files can be in the same file or separate `tests/` directory

## Troubleshooting

### Extension Not Activating

- Ensure `course.json` exists in workspace root
- Check that `course.json` is valid JSON
- Reload VS Code window (Ctrl+Shift+P → "Reload Window")

### Tests Not Running

- **JavaScript**: Run `npm install` in course directory
- **Python**: Ensure pytest is installed
- **Go**: Ensure Go is installed and in PATH
- **Rust**: Ensure Rust and Cargo are installed

### AI Hints Not Working

- Check Ollama is running: `ollama list`
- Verify Ollama URL in settings
- Try pulling model: `ollama pull llama2`
- Check extension output for errors

### Progress Not Saving

- Check extension has write permissions to global storage
- Try resetting progress: "Learn Programming: Reset Progress"

## Examples

This repository includes example courses:

- **JavaScript Basics** (`examples/javascript-basics/`)
  - Hello World
  - Variables and Data Types
  - Functions

More examples coming soon for Python, Go, and Rust!

## Contributing

Contributions are welcome! Please visit the [GitHub repository](https://github.com/arturkot/learn-programming-vscode) to:

- Report bugs
- Request features
- Submit pull requests
- Share your courses

## Course Sharing

Have you created an awesome course? Share it with the community!

1. Publish your course to GitHub
2. Add the `learn-programming-course` topic
3. Submit a PR to add it to our course directory

## Support

- **Documentation**: [GitHub Wiki](https://github.com/arturkot/learn-programming-vscode/wiki)
- **Issues**: [GitHub Issues](https://github.com/arturkot/learn-programming-vscode/issues)
- **Discussions**: [GitHub Discussions](https://github.com/arturkot/learn-programming-vscode/discussions)

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Inspired by interactive learning tools like Rustlings and Exercism
- Built with love for the programming education community
- Powered by VS Code's powerful extension API

---

**Happy Learning!** 🚀

Made with ❤️ by Artur Kot
