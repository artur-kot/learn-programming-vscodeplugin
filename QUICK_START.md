# Quick Start Guide

Get your Learn Programming extension up and running in minutes!

## Installation & Setup

### 1. Install Dependencies

```bash
cd C:\Users\artur\Development\learn-programming-vscodeplugin
npm install
```

### 2. Compile TypeScript

```bash
npm run compile
```

### 3. Test the Extension

Press `F5` in VS Code to launch Extension Development Host.

### 4. Open Example Course

In the new VS Code window:
```
File → Open Folder → C:\Users\artur\Development\learn-programming-vscodeplugin\examples\javascript-basics\
```

### 5. Install Example Course Dependencies

```bash
cd examples/javascript-basics
npm install
```

### 6. Start Learning!

1. Look for "Learn Programming" icon in the Activity Bar (left sidebar)
2. Click on the first exercise
3. Edit the `exercise.js` file
4. Click "Run Tests" button
5. Complete the exercise!

---

## Development Workflow

### Watch Mode (Auto-compile on save)

```bash
npm run watch
```

### Reload Extension

After making code changes:
1. In Extension Development Host: `Ctrl+R` (Windows/Linux) or `Cmd+R` (Mac)
2. Or use Command Palette: "Developer: Reload Window"

### Debug Extension

1. Set breakpoints in your TypeScript files
2. Press `F5` to start debugging
3. Breakpoints will hit when you use the extension

### View Logs

- Extension Host logs: `Help → Toggle Developer Tools → Console`
- Output channel: `View → Output → Select "Learn Programming"`

---

## Testing

### Manual Testing Checklist

Test in Extension Development Host:

- [ ] Extension activates when opening course workspace
- [ ] Tree view shows all exercises
- [ ] First exercise is unlocked, others are locked
- [ ] Clicking exercise opens file and webview
- [ ] Running tests shows output
- [ ] Passing tests marks exercise complete
- [ ] Next exercise unlocks automatically
- [ ] Progress persists after reload
- [ ] Reset progress works
- [ ] All commands work from Command Palette

### Create Test Course

Minimal test course structure:

```bash
mkdir test-course
cd test-course

# Create course.json
cat > course.json << 'EOF'
{
  "name": "Test Course",
  "description": "Testing",
  "author": "Test",
  "version": "1.0.0",
  "language": "javascript",
  "exercises": [
    {
      "id": "test-01",
      "title": "Test Exercise",
      "description": "A test",
      "order": 1
    }
  ]
}
EOF

# Create exercise
mkdir -p exercises/test-01
cd exercises/test-01

# Create exercise file
cat > exercise.js << 'EOF'
function test() {
  return true;
}
module.exports = { test };
EOF

# Create test file
cat > test-01.test.js << 'EOF'
const { test } = require('./exercise');
describe('Test', () => {
  test('should return true', () => {
    expect(test()).toBe(true);
  });
});
EOF

# Create README
echo "# Test Exercise\nComplete the test function." > README.md

# Back to course root
cd ../..

# Initialize npm
npm init -y
npm install --save-dev jest
```

---

## Package for Distribution

### Create VSIX Package

```bash
npm install -g @vscode/vsce
vsce package
```

This creates: `learn-programming-0.1.0.vsix`

### Install Locally

```bash
code --install-extension learn-programming-0.1.0.vsix
```

### Test Packaged Extension

1. Restart VS Code
2. Open example course
3. Verify all features work

---

## Publishing (Summary)

See `PUBLISHING_GUIDE.md` for complete details.

### Quick Publish Steps

1. **Create Publisher Account**
   - Go to https://marketplace.visualstudio.com/manage
   - Create publisher with name "ArturKot"

2. **Get Personal Access Token**
   - Create at https://dev.azure.com
   - Scope: Marketplace (Manage)

3. **Login**
   ```bash
   vsce login ArturKot
   ```

4. **Publish**
   ```bash
   vsce publish
   ```

---

## Common Issues & Solutions

### Issue: Extension doesn't activate

**Check:**
- Is `course.json` in workspace root?
- Is `course.json` valid JSON?

**Solution:**
```bash
# Validate course.json
cat course.json | python -m json.tool
```

### Issue: Tests don't run

**JavaScript:**
```bash
cd examples/javascript-basics
npm install
npm test  # Should work standalone
```

**Check:**
- Is `node_modules` present?
- Is Jest installed?
- Do test files match pattern `*.test.js`?

### Issue: Compilation errors

```bash
# Clean and rebuild
rm -rf out
npm run compile
```

### Issue: Cannot find module

**Solution:** Ensure all imports are correct:
```typescript
// Use relative paths
import { Course } from './types';

// Not absolute paths
import { Course } from 'types';  // ❌ Wrong
```

---

## Project Structure Overview

```
learn-programming-vscodeplugin/
├── src/                          # Source code (TypeScript)
│   ├── extension.ts             # Main entry point
│   ├── types.ts                 # Type definitions
│   ├── courseManager.ts         # Course loading
│   ├── progressTracker.ts       # SQLite progress
│   ├── exerciseProvider.ts      # Tree view
│   ├── testRunner.ts            # Test execution
│   ├── webviewProvider.ts       # Instructions panel
│   └── hintProvider.ts          # AI hints
├── out/                          # Compiled JavaScript (auto-generated)
├── media/                        # Icons and assets
├── examples/                     # Example courses
│   └── javascript-basics/       # JavaScript course
├── package.json                  # Extension manifest
├── tsconfig.json                # TypeScript config
├── README.md                    # User documentation
└── PUBLISHING_GUIDE.md          # Publishing instructions
```

---

## Next Steps

### Immediate

1. ✓ Install dependencies
2. ✓ Compile TypeScript
3. ✓ Test extension
4. Create icon.png (if not done)
5. Test all features thoroughly

### Before Publishing

1. Create proper PNG icon (256x256)
2. Add screenshots to README
3. Test packaged .vsix file
4. Create GitHub repository
5. Set up publisher account

### After Publishing

1. Monitor marketplace reviews
2. Respond to issues on GitHub
3. Create more example courses
4. Add features from roadmap
5. Build community

---

## Development Tips

### TypeScript Tips

- Use strict type checking
- Define interfaces for all data structures
- Use `async/await` for asynchronous operations
- Handle errors with try-catch blocks

### VS Code Extension Tips

- Use `vscode.window.showInformationMessage` for user feedback
- Use `vscode.workspace.getConfiguration` for settings
- Dispose of resources in `deactivate()`
- Use `context.subscriptions.push()` for lifecycle management

### Testing Tips

- Test with different course structures
- Test with locked/unlocked exercises
- Test progress persistence
- Test error cases (missing files, invalid JSON)
- Test with different VS Code themes

---

## Getting Help

### Documentation

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Extension Guides](https://code.visualstudio.com/api/extension-guides/overview)
- [Extension Samples](https://github.com/microsoft/vscode-extension-samples)

### Community

- [VS Code GitHub](https://github.com/microsoft/vscode)
- [VS Code Discussions](https://github.com/microsoft/vscode/discussions)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/visual-studio-code)

---

## Useful Commands

```bash
# Development
npm run compile          # Compile TypeScript
npm run watch           # Watch mode (auto-compile)
npm run lint            # Run ESLint

# Testing
F5                      # Launch Extension Development Host
Ctrl+R (in dev host)    # Reload window

# Packaging
vsce package            # Create .vsix file
vsce publish            # Publish to marketplace
vsce publish patch      # Bump patch version and publish

# Git
git add .
git commit -m "message"
git push

# Example course setup
cd examples/javascript-basics
npm install
npm test
```

---

**You're all set!** Happy coding! 🚀

Need help? Check `PUBLISHING_GUIDE.md` or open an issue on GitHub.
