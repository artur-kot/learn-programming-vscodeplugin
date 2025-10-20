# VS Code Plugin - Learn Programming Extension
## Technical Plan & Implementation Guide

---

## Project Overview

This document outlines the technical plan for creating a Visual Studio Code extension that replicates and enhances the functionality of the Learn Programming TUI application. The extension will provide an integrated learning experience directly within VS Code, allowing developers to learn programming through interactive exercises without leaving their editor.

### Source Project Analysis

The current TUI application (built in Rust with `ratatui`) provides:
- Interactive programming course navigation
- On-demand test execution with real-time streaming output
- SQLite-based progress tracking
- Dual-panel interface (exercise list + details/output)
- AI-powered hints via Ollama integration
- Course management with structured JSON metadata

---

## Core Objectives

### Primary Goals
1. **Seamless Integration**: Bring the learning experience into VS Code's native environment
2. **Enhanced Interactivity**: Leverage VS Code's UI capabilities for better UX
3. **Progressive Unlocking**: Maintain the gamification aspect with locked/unlocked exercises
4. **Real-time Feedback**: Stream test output as it runs
5. **AI Assistance**: Integrate AI hints when tests fail
6. **Cross-Platform**: Support Windows, macOS, and Linux

### Key Improvements Over TUI
- Native file editing (no external editor needed)
- Better syntax highlighting and IntelliSense
- Integrated terminal for test output
- Webview-based rich content display
- Side-by-side code and instructions
- VS Code's debugging capabilities

---

## Architecture Design

### Extension Structure

```
vscode-learn-programming/
├── src/
│   ├── extension.ts              # Main extension entry point
│   ├── courseManager.ts          # Course loading and management
│   ├── exerciseProvider.ts       # Tree view data provider
│   ├── testRunner.ts             # Test execution and streaming
│   ├── progressTracker.ts        # SQLite database wrapper
│   ├── hintProvider.ts           # AI hint generation (Ollama)
│   ├── webviewProvider.ts        # Exercise details webview
│   ├── config.ts                 # Extension configuration
│   └── types.ts                  # TypeScript interfaces
├── media/
│   ├── styles.css                # Webview styles
│   └── icons/                    # Exercise status icons
├── package.json                  # Extension manifest
├── tsconfig.json                 # TypeScript config
└── README.md                     # Extension documentation
```

---

## Core Components

### 1. Extension Activation

**File**: `extension.ts`

**Responsibilities**:
- Activate when a workspace contains `course.json`
- Register all commands and views
- Initialize course manager and progress tracker
- Set up context keys for conditional UI

**Key Commands**:
- `learnProgramming.openCourse` - Open/reload course
- `learnProgramming.runTests` - Execute tests for current exercise
- `learnProgramming.showHint` - Generate AI hint
- `learnProgramming.resetProgress` - Clear progress data
- `learnProgramming.nextExercise` - Navigate to next unlocked
- `learnProgramming.previousExercise` - Navigate to previous

**Activation Events**:
```json
"activationEvents": [
  "workspaceContains:**/course.json",
  "onCommand:learnProgramming.openCourse"
]
```

---

### 2. Course Manager

**File**: `courseManager.ts`

**Purpose**: Load and manage course metadata and exercises

**Interface**:
```typescript
interface Course {
  name: string;
  description: string;
  author: string;
  version: string;
  exercises: ExerciseMetadata[];
}

interface ExerciseMetadata {
  id: string;
  title: string;
  description: string;
  order: number;
  contextFiles?: string[];
  contextPatterns?: string[];
}

interface Exercise extends ExerciseMetadata {
  path: string;
  exerciseFile: string;
  testFile: string;
  readmeFile: string;
}
```

**Methods**:
- `loadCourse(workspacePath: string): Promise<Course>`
- `getExercises(): Exercise[]`
- `getExerciseById(id: string): Exercise | undefined`
- `validateCourseStructure(): boolean`

---

### 3. Exercise Tree View Provider

**File**: `exerciseProvider.ts`

**Purpose**: Display exercises in VS Code's sidebar with status indicators

**Tree Item Structure**:
```typescript
class ExerciseTreeItem extends vscode.TreeItem {
  constructor(
    public readonly exercise: Exercise,
    public readonly status: ExerciseStatus
  ) {
    super(exercise.title, vscode.TreeItemCollapsibleState.None);

    // Set icon based on status
    this.iconPath = this.getIconForStatus(status);

    // Set context value for conditional commands
    this.contextValue = status.isLocked ? 'locked' : 'unlocked';

    // Command to open exercise when clicked
    this.command = {
      command: 'learnProgramming.openExercise',
      title: 'Open Exercise',
      arguments: [exercise]
    };
  }
}

enum ExerciseStatus {
  Locked,      // Gray lock icon
  Available,   // Empty circle
  InProgress,  // Yellow circle
  Completed    // Green checkmark
}
```

**Features**:
- Visual indicators (✓ completed, ● in-progress, 🔒 locked)
- Disable click on locked exercises
- Auto-refresh on progress changes
- Show completion percentage in view title

---

### 4. Test Runner

**File**: `testRunner.ts`

**Purpose**: Execute Jest tests with real-time output streaming

**Implementation**:
```typescript
class TestRunner {
  async runTestStreaming(
    exercise: Exercise,
    outputChannel: vscode.OutputChannel
  ): Promise<TestResult> {
    // Check node_modules exists
    // Spawn npm test with streaming
    // Parse output for pass/fail
    // Update progress tracker
    // Return structured result
  }
}

enum TestResult {
  Passed,
  Failed,
  Error
}
```

**Features**:
- Stream output to VS Code Output Channel
- Parse ANSI colors for rich formatting
- Handle Windows vs Unix command differences
- Detect pass/fail from Jest output
- Cancel running tests on demand

**Output Display**:
- Use `vscode.window.createOutputChannel()` for test results
- Show progress notifications during test runs
- Display inline decorations in editor for errors

---

### 5. Progress Tracker

**File**: `progressTracker.ts`

**Purpose**: SQLite-based persistence of exercise completion

**Schema**:
```sql
CREATE TABLE exercise_progress (
  exercise_id TEXT PRIMARY KEY,
  completed INTEGER NOT NULL DEFAULT 0,
  last_attempt TEXT,
  completed_at TEXT
);
```

**Methods**:
- `markCompleted(exerciseId: string): Promise<void>`
- `markAttempted(exerciseId: string): Promise<void>`
- `getProgress(exerciseId: string): Promise<ExerciseProgress>`
- `getAllProgress(): Promise<Map<string, ExerciseProgress>>`
- `isExerciseUnlocked(exerciseIndex: number): boolean`

**Storage Location**:
- Use `context.globalStorageUri` for cross-workspace persistence
- One DB per course (identified by course name)
- Platform-agnostic path handling

---

### 6. Webview Panel for Exercise Details

**File**: `webviewProvider.ts`

**Purpose**: Rich display of exercise README and instructions

**Features**:
- Markdown rendering with syntax highlighting
- Split view: Instructions (left) + Code (right)
- Action buttons (Run Tests, Show Hint, Next Exercise)
- Embedded test output viewer
- Responsive design

**Communication**:
```typescript
// Extension -> Webview
webview.postMessage({
  type: 'updateExercise',
  exercise: currentExercise,
  readme: markdownContent
});

// Webview -> Extension
webview.onDidReceiveMessage(message => {
  switch (message.command) {
    case 'runTests':
      this.runTests();
      break;
    case 'showHint':
      this.generateHint();
      break;
  }
});
```

---

### 7. AI Hint Provider

**File**: `hintProvider.ts`

**Purpose**: Generate contextual hints via Ollama API

**Flow**:
1. Collect context files (exercise code, test output)
2. Build prompt with exercise description + failures
3. Stream response from Ollama
4. Display in webview with typing animation

**Configuration**:
- Model selection via VS Code settings
- Fallback to default model (e.g., `llama2`)
- Error handling for Ollama connectivity issues

**Settings**:
```json
{
  "learnProgramming.ollamaModel": "llama2",
  "learnProgramming.ollamaUrl": "http://localhost:11434",
  "learnProgramming.enableHints": true
}
```

---

## User Interface Design

### Sidebar View: "Learn Programming"

```
LEARN PROGRAMMING
─────────────────────────────
JavaScript Fundamentals
 Course by JS Learner Team

 ✓ 1 - Hello World
 ✓ 2 - Variables and Data Types
 ● 3 - Functions (in progress)
 🔒 4 - Arrays

Progress: 2/4 (50%)

[Run Tests] [Show Hint]
```

### Webview Panel Layout

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    /* VS Code theme-aware styles */
    body {
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
    }
    .exercise-header {
      background: var(--vscode-editor-background);
      padding: 20px;
      border-bottom: 1px solid var(--vscode-panel-border);
    }
    .readme-content {
      padding: 20px;
      line-height: 1.6;
    }
    .actions {
      position: sticky;
      bottom: 0;
      background: var(--vscode-editor-background);
      padding: 10px;
      border-top: 1px solid var(--vscode-panel-border);
    }
  </style>
</head>
<body>
  <div class="exercise-header">
    <h1>Exercise 3: Functions</h1>
    <p>Create and use functions with parameters</p>
  </div>

  <div class="readme-content">
    <!-- Markdown rendered here -->
  </div>

  <div class="actions">
    <button onclick="runTests()">Run Tests</button>
    <button onclick="showHint()">Get Hint</button>
    <button onclick="nextExercise()">Next Exercise →</button>
  </div>
</body>
</html>
```

---

## Workflow & User Journey

### 1. Initial Setup
```
User opens workspace containing course.json
  ↓
Extension activates automatically
  ↓
Course loads, exercises appear in sidebar
  ↓
First incomplete exercise is auto-selected
  ↓
Webview shows exercise instructions
```

### 2. Working on Exercise
```
User reads instructions in webview
  ↓
User edits exercise.js in editor
  ↓
User clicks "Run Tests" or uses command
  ↓
Tests run, output streams to Output Channel
  ↓
Results appear (Pass/Fail)
  ↓
If Pass: Exercise marked complete, next unlocks
If Fail: "Get Hint" button becomes available
```

### 3. Getting Help
```
User clicks "Get Hint" after failing tests
  ↓
Extension checks Ollama configuration
  ↓
Sends exercise context + test output to Ollama
  ↓
Hint streams into webview with typing effect
  ↓
User applies hint, re-runs tests
```

---

## Technical Implementation Details

### Test Execution Strategy

```typescript
async function runTests(exercise: Exercise): Promise<void> {
  const outputChannel = vscode.window.createOutputChannel('Learn Programming: Tests');
  outputChannel.show(true);

  // Show progress notification
  await vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: `Running tests for ${exercise.title}`,
    cancellable: true
  }, async (progress, token) => {

    // Spawn npm test process
    const testProcess = spawn('npm', ['test', '--',
      '--testPathPattern', `${exercise.id}.*\\.test\\.js$`,
      '--no-color'
    ], {
      cwd: workspacePath,
      shell: true
    });

    // Stream stdout/stderr to output channel
    testProcess.stdout.on('data', (data) => {
      outputChannel.append(data.toString());
    });

    testProcess.stderr.on('data', (data) => {
      outputChannel.append(data.toString());
    });

    // Wait for completion
    const exitCode = await new Promise<number>((resolve) => {
      testProcess.on('close', resolve);
    });

    // Update progress based on result
    if (exitCode === 0) {
      await progressTracker.markCompleted(exercise.id);
      vscode.window.showInformationMessage(`✓ ${exercise.title} completed!`);
    } else {
      await progressTracker.markAttempted(exercise.id);
      vscode.window.showErrorMessage(`✗ Tests failed. Click "Get Hint" for help.`);
    }

    // Refresh tree view
    exerciseProvider.refresh();
  });
}
```

### Progressive Unlocking Logic

```typescript
function isExerciseUnlocked(exerciseIndex: number): boolean {
  const progress = progressTracker.getAllProgress();

  // First exercise is always unlocked
  if (exerciseIndex === 0) return true;

  // Check if all previous exercises are completed
  for (let i = 0; i < exerciseIndex; i++) {
    const exercise = exercises[i];
    const exerciseProgress = progress.get(exercise.id);

    if (!exerciseProgress || !exerciseProgress.completed) {
      return false; // Previous exercise not completed
    }
  }

  return true;
}
```

### AI Hint Generation

```typescript
async function generateHint(exercise: Exercise, testOutput: string): Promise<string> {
  const ollamaUrl = vscode.workspace.getConfiguration('learnProgramming').get<string>('ollamaUrl');
  const model = vscode.workspace.getConfiguration('learnProgramming').get<string>('ollamaModel');

  // Collect context files
  const exerciseCode = await vscode.workspace.fs.readFile(vscode.Uri.file(exercise.exerciseFile));

  const prompt = `You are a helpful programming tutor. A student is working on the following exercise:

Exercise: ${exercise.title}
Description: ${exercise.description}

Current code:
\`\`\`javascript
${exerciseCode.toString()}
\`\`\`

Test output showing failures:
\`\`\`
${testOutput}
\`\`\`

Provide a helpful hint (not the full solution) to guide them toward fixing the issue. Be encouraging and educational.

Hint:`;

  // Call Ollama API
  const response = await fetch(`${ollamaUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model,
      prompt: prompt,
      stream: false
    })
  });

  const data = await response.json();
  return data.response;
}
```

---

## Extension Configuration

### package.json Configuration Contributions

```json
{
  "contributes": {
    "configuration": {
      "title": "Learn Programming",
      "properties": {
        "learnProgramming.ollamaModel": {
          "type": "string",
          "default": "llama2",
          "description": "Ollama model to use for hint generation"
        },
        "learnProgramming.ollamaUrl": {
          "type": "string",
          "default": "http://localhost:11434",
          "description": "Ollama API URL"
        },
        "learnProgramming.enableHints": {
          "type": "boolean",
          "default": true,
          "description": "Enable AI-powered hints"
        },
        "learnProgramming.autoOpenExercise": {
          "type": "boolean",
          "default": true,
          "description": "Automatically open exercise file when selected"
        },
        "learnProgramming.showTestOutputInTerminal": {
          "type": "boolean",
          "default": false,
          "description": "Show test output in integrated terminal instead of output channel"
        }
      }
    },
    "commands": [
      {
        "command": "learnProgramming.openCourse",
        "title": "Learn Programming: Open Course"
      },
      {
        "command": "learnProgramming.runTests",
        "title": "Learn Programming: Run Tests",
        "icon": "$(play)"
      },
      {
        "command": "learnProgramming.showHint",
        "title": "Learn Programming: Get Hint",
        "icon": "$(lightbulb)"
      },
      {
        "command": "learnProgramming.nextExercise",
        "title": "Learn Programming: Next Exercise"
      },
      {
        "command": "learnProgramming.resetProgress",
        "title": "Learn Programming: Reset Progress"
      }
    ],
    "viewsContainers": {
      "activitybar": [
        {
          "id": "learn-programming",
          "title": "Learn Programming",
          "icon": "media/icon.svg"
        }
      ]
    },
    "views": {
      "learn-programming": [
        {
          "id": "exerciseList",
          "name": "Exercises"
        }
      ]
    },
    "menus": {
      "view/title": [
        {
          "command": "learnProgramming.runTests",
          "when": "view == exerciseList",
          "group": "navigation"
        }
      ],
      "view/item/context": [
        {
          "command": "learnProgramming.runTests",
          "when": "view == exerciseList && viewItem == unlocked",
          "group": "inline"
        }
      ]
    }
  }
}
```

---

## Data Persistence

### SQLite Database Schema

```sql
-- Exercise progress tracking
CREATE TABLE IF NOT EXISTS exercise_progress (
    exercise_id TEXT PRIMARY KEY,
    completed INTEGER NOT NULL DEFAULT 0,
    last_attempt TEXT,
    completed_at TEXT
);

-- Course metadata cache (for faster loading)
CREATE TABLE IF NOT EXISTS course_metadata (
    course_name TEXT PRIMARY KEY,
    last_loaded TEXT,
    total_exercises INTEGER,
    completed_exercises INTEGER
);

-- User preferences per course
CREATE TABLE IF NOT EXISTS user_preferences (
    course_name TEXT PRIMARY KEY,
    last_exercise TEXT,
    hints_used INTEGER DEFAULT 0,
    total_test_runs INTEGER DEFAULT 0
);
```

### Storage Location

- **Global Storage**: `context.globalStorageUri` (survives workspace changes)
- **Database Path**: `~/.vscode/extensions/learn-programming/courses/{course-name}.db`
- **Cross-platform compatibility** via `path.join()`

---

## Testing Strategy

### Unit Tests
- Test course loading with various `course.json` structures
- Test progress tracking logic
- Test exercise unlocking rules
- Mock Ollama API responses

### Integration Tests
- Test full workflow: open course → run tests → check progress
- Test webview communication
- Test command registration and execution

### E2E Tests
- Use VS Code Extension Test Runner
- Test with example course
- Verify UI elements appear correctly

---

## Deployment & Distribution

### Build Process
1. Compile TypeScript (`tsc -p ./`)
2. Bundle with webpack for smaller package size
3. Run tests (`npm test`)
4. Package extension (`vsce package`)

### Publishing
- Publish to VS Code Marketplace via `vsce publish`
- Create GitHub releases with `.vsix` files
- Document installation via `.vsix` for offline use

### Version Management
- Follow semantic versioning
- Maintain changelog
- Provide migration guide for breaking changes

---

## Future Enhancements

### Phase 2 Features
1. **Multi-language Support**: Extend beyond JavaScript (Python, Go, Rust)
2. **Custom Test Runners**: Support other test frameworks (pytest, Go test)
3. **Cloud Sync**: Sync progress across devices
4. **Leaderboards**: Compare progress with other learners
5. **Course Marketplace**: Discover and install courses from community
6. **Offline Hints**: Cache common hints for offline use
7. **Video Tutorials**: Embed video walkthroughs in webview
8. **Code Snippets**: Provide insertable code snippets as hints
9. **Peer Review**: Share solutions with community for feedback

### Advanced Features
- **Adaptive Difficulty**: Adjust hint detail based on user progress
- **Time Tracking**: Track time spent per exercise
- **Achievement System**: Badges for milestones
- **Dark/Light Theme**: Webview theme matching
- **Export Progress**: PDF/CSV export of learning journey

---

## Migration from TUI

### Compatibility Checklist
- ✅ Course structure (`course.json`) is identical
- ✅ Exercise directory layout is the same
- ✅ SQLite schema is compatible (can reuse existing DB)
- ✅ Test runner uses same npm commands
- ✅ Ollama integration is API-compatible

### Migration Path for Users
1. Install VS Code extension
2. Open existing course folder in VS Code
3. Extension auto-detects `course.json`
4. Progress is preserved (same DB schema)
5. Continue learning seamlessly

---

## Security Considerations

1. **Code Execution**: Tests run in user's workspace (sandboxed by Node.js)
2. **AI Prompts**: Never send sensitive data to Ollama
3. **Database**: Local-only storage, no cloud sync by default
4. **Extensions API**: Follow VS Code security best practices
5. **Input Validation**: Sanitize course.json and user inputs

---

## Performance Optimization

1. **Lazy Loading**: Load exercise content on-demand
2. **Debounced Refreshes**: Avoid excessive tree view updates
3. **Cached Markdown**: Pre-render README content
4. **Webview Reuse**: Persist webview instance across exercises
5. **Incremental Progress Updates**: Batch DB writes

---

## Development Roadmap

### Milestone 1: Core Functionality (Week 1-2)
- ✅ Extension scaffolding
- ✅ Course loading
- ✅ Tree view provider
- ✅ Basic test runner
- ✅ Progress tracking

### Milestone 2: Enhanced UX (Week 3-4)
- ✅ Webview panel for instructions
- ✅ Real-time test output streaming
- ✅ Exercise locking/unlocking
- ✅ Status icons and indicators

### Milestone 3: AI Integration (Week 5-6)
- ✅ Ollama API integration
- ✅ Hint generation
- ✅ Model selection UI
- ✅ Error handling for offline mode

### Milestone 4: Polish & Release (Week 7-8)
- ✅ Comprehensive testing
- ✅ Documentation
- ✅ Example courses
- ✅ Marketplace publishing

---

## Dependencies

### Runtime Dependencies
```json
{
  "dependencies": {
    "sqlite3": "^5.1.6",
    "node-fetch": "^3.3.0",
    "markdown-it": "^13.0.1"
  }
}
```

### Development Dependencies
```json
{
  "devDependencies": {
    "@types/vscode": "^1.80.0",
    "@types/node": "^20.0.0",
    "@types/sqlite3": "^3.1.8",
    "typescript": "^5.1.0",
    "webpack": "^5.88.0",
    "webpack-cli": "^5.1.0",
    "@vscode/test-electron": "^2.3.0",
    "eslint": "^8.44.0",
    "@typescript-eslint/parser": "^5.60.0"
  }
}
```

---

## Success Metrics

### Quantitative KPIs
- **Adoption Rate**: Downloads per month
- **Engagement**: Average exercises completed per user
- **Retention**: Users returning after 7/30 days
- **Performance**: Extension activation time < 2s

### Qualitative Goals
- **User Satisfaction**: Positive reviews on marketplace
- **Learning Outcomes**: Users report improved understanding
- **Course Creation**: Community contributes new courses
- **Integration**: Seamless feeling with VS Code

---

## Support & Maintenance

### Documentation
- README with getting started guide
- API documentation for course creators
- Troubleshooting guide
- Video tutorials

### Community
- GitHub repository for issues and discussions
- Discord server for real-time help
- Monthly AMA sessions
- Course creator showcase

---

## Conclusion

This VS Code extension transforms the Learn Programming TUI into a modern, integrated development environment for interactive learning. By leveraging VS Code's rich extensibility API, we can create a superior learning experience while maintaining compatibility with the existing course structure.

The extension will serve as both a standalone learning tool and a platform for community-driven educational content, empowering developers to learn programming in their preferred environment.

---

## Quick Start for Development

```bash
# Clone the repository (once created)
git clone https://github.com/your-username/vscode-learn-programming.git
cd vscode-learn-programming

# Install dependencies
npm install

# Open in VS Code
code .

# Run extension in debug mode (F5)
# This opens a new VS Code window with the extension loaded

# Make changes, reload window (Ctrl+R) to test

# Run tests
npm test

# Package extension
npm run package
```

---

**Document Version**: 1.0
**Last Updated**: 2025-10-20
**Author**: Claude (AI Assistant)
**Status**: Initial Draft - Ready for Implementation
