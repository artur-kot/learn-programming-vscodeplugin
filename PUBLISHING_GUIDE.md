# Publishing Guide: VS Code Marketplace

This guide walks you through publishing the Learn Programming extension to the Visual Studio Code Marketplace.

## Prerequisites

Before you begin, ensure you have:

- [x] Completed extension code
- [x] Node.js and npm installed
- [x] A Microsoft account (for Azure DevOps)
- [x] A publisher account on VS Code Marketplace

---

## Step 1: Install Dependencies

```bash
cd C:\Users\artur\Development\learn-programming-vscodeplugin

# Install dependencies
npm install

# Install vsce (VS Code Extension Manager) globally
npm install -g @vscode/vsce
```

---

## Step 2: Create Publisher Account

### 2.1 Create Azure DevOps Organization

1. Go to [Azure DevOps](https://dev.azure.com)
2. Sign in with your Microsoft account
3. Click "Create new organization"
4. Choose an organization name (e.g., `arturkot-dev`)
5. Complete the setup

### 2.2 Create Personal Access Token (PAT)

1. In Azure DevOps, click your profile icon → "Personal access tokens"
2. Click "+ New Token"
3. Fill in the form:
   - **Name**: `vscode-marketplace`
   - **Organization**: Select "All accessible organizations"
   - **Expiration**: Choose 90 days or custom
   - **Scopes**: Click "Show all scopes"
   - Check **Marketplace** → ✓ **Manage**
4. Click "Create"
5. **IMPORTANT**: Copy the token immediately (you won't see it again!)
6. Save it securely (password manager or secure note)

### 2.3 Create VS Code Publisher

1. Go to [Visual Studio Marketplace Publisher Management](https://marketplace.visualstudio.com/manage)
2. Sign in with the same Microsoft account
3. Click "Create publisher"
4. Fill in the form:
   - **Name**: `ArturKot` (must match `package.json` publisher field)
   - **ID**: `arturkot` (lowercase, no spaces)
   - **Display name**: `Artur Kot`
   - **Email**: Your email address
   - **Personal URL**: Your website or GitHub profile (optional)
5. Upload a profile picture (optional but recommended)
6. Click "Create"

---

## Step 3: Login with vsce

Open your terminal and login:

```bash
vsce login ArturKot
```

When prompted, paste your Personal Access Token.

You should see: `Successfully logged in as ArturKot`

---

## Step 4: Prepare Extension for Publishing

### 4.1 Create PNG Icon (Required)

The marketplace requires a PNG icon (128x128px minimum). Convert the SVG:

**Option A: Using Online Tool**
1. Go to [CloudConvert](https://cloudconvert.com/svg-to-png)
2. Upload `media/icon.svg`
3. Set size to 256x256 or 512x512
4. Download and save as `media/icon.png`

**Option B: Using ImageMagick (if installed)**
```bash
magick convert media/icon.svg -resize 256x256 media/icon.png
```

**Option C: Manual Design**
Create a 256x256px PNG in your favorite image editor with your extension's logo.

### 4.2 Verify package.json

Ensure your `package.json` has all required fields:

```json
{
  "name": "learn-programming",
  "displayName": "Learn Programming",
  "description": "Interactive programming courses with AI-powered hints",
  "version": "0.1.0",
  "publisher": "ArturKot",
  "icon": "media/icon.png",
  "repository": {
    "type": "git",
    "url": "https://github.com/arturkot/learn-programming-vscode.git"
  },
  "license": "MIT",
  "keywords": [
    "learning",
    "education",
    "tutorial"
  ],
  "categories": [
    "Education",
    "Programming Languages",
    "Other"
  ]
}
```

### 4.3 Add Gallery Banner (Optional but Recommended)

Add to `package.json`:

```json
{
  "galleryBanner": {
    "color": "#007ACC",
    "theme": "dark"
  }
}
```

---

## Step 5: Test the Extension Locally

### 5.1 Compile TypeScript

```bash
npm run compile
```

Fix any compilation errors that appear.

### 5.2 Test in Extension Development Host

1. Open VS Code in the extension directory
2. Press `F5` to launch Extension Development Host
3. Open the example course:
   ```
   File → Open Folder → examples/javascript-basics/
   ```
4. Test all features:
   - [ ] Extension activates
   - [ ] Tree view shows exercises
   - [ ] Opening an exercise works
   - [ ] Running tests works
   - [ ] Progress tracking works
   - [ ] Webview displays correctly

### 5.3 Package Extension Locally

```bash
vsce package
```

This creates a `.vsix` file (e.g., `learn-programming-0.1.0.vsix`).

### 5.4 Test the Packaged Extension

```bash
code --install-extension learn-programming-0.1.0.vsix
```

Restart VS Code and test again with the example course.

---

## Step 6: Publish to Marketplace

### 6.1 Final Checklist

Before publishing, verify:

- [x] All code is compiled without errors
- [x] `README.md` is complete and well-formatted
- [x] `CHANGELOG.md` documents v0.1.0
- [x] `LICENSE` file exists
- [x] Icon is a PNG file
- [x] Version number is correct in `package.json`
- [x] Repository URL is correct
- [x] No sensitive data (API keys, tokens) in code
- [x] `.vscodeignore` excludes source files and dev dependencies

### 6.2 Publish Command

```bash
vsce publish
```

This will:
1. Package the extension
2. Upload to VS Code Marketplace
3. Make it available for installation within minutes

**Alternative: Publish a specific version**
```bash
vsce publish 0.1.0
```

**Or publish with version bump:**
```bash
# Patch: 0.1.0 → 0.1.1
vsce publish patch

# Minor: 0.1.0 → 0.2.0
vsce publish minor

# Major: 0.1.0 → 1.0.0
vsce publish major
```

---

## Step 7: Verify Publication

### 7.1 Check Marketplace

1. Go to [Visual Studio Marketplace](https://marketplace.visualstudio.com/)
2. Search for "Learn Programming" or your extension name
3. Verify:
   - Icon displays correctly
   - Description is accurate
   - Screenshots (if added) appear
   - Installation instructions are clear

### 7.2 Test Installation

In a fresh VS Code instance:

1. Go to Extensions (Ctrl+Shift+X)
2. Search for "Learn Programming"
3. Click "Install"
4. Test with example course

---

## Step 8: Post-Publication Tasks

### 8.1 Create GitHub Repository

If you haven't already:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/arturkot/learn-programming-vscode.git
git push -u origin main
```

### 8.2 Add Topics to GitHub

On GitHub, add repository topics:
- `vscode-extension`
- `education`
- `learning`
- `programming`
- `javascript`
- `python`
- `go`
- `rust`

### 8.3 Create a Release

1. Go to GitHub repository → Releases
2. Click "Create a new release"
3. Tag: `v0.1.0`
4. Title: `v0.1.0 - Initial Release`
5. Description: Copy from CHANGELOG.md
6. Attach the `.vsix` file
7. Click "Publish release"

### 8.4 Share Your Extension

- Tweet about it
- Share on Reddit (r/vscode, r/learnprogramming)
- Post on Dev.to or Medium
- Share in programming Discord servers
- Submit to VS Code extension lists

---

## Updating the Extension

### For Bug Fixes (Patch)

1. Fix the bug
2. Update CHANGELOG.md
3. Run tests
4. Publish:
   ```bash
   vsce publish patch
   ```

### For New Features (Minor)

1. Implement feature
2. Update README.md and CHANGELOG.md
3. Bump version:
   ```bash
   vsce publish minor
   ```

### For Breaking Changes (Major)

1. Implement changes
2. Update all documentation
3. Add migration guide
4. Publish:
   ```bash
   vsce publish major
   ```

---

## Troubleshooting

### ERROR: Missing publisher name

**Solution**: Add `"publisher": "ArturKot"` to package.json

### ERROR: Icon not found

**Solution**:
- Ensure `media/icon.png` exists
- Add `"icon": "media/icon.png"` to package.json

### ERROR: Cannot publish, not logged in

**Solution**:
```bash
vsce login ArturKot
```
Enter your Personal Access Token

### ERROR: Repository URL required

**Solution**: Add to package.json:
```json
{
  "repository": {
    "type": "git",
    "url": "https://github.com/arturkot/learn-programming-vscode.git"
  }
}
```

### ERROR: Package exceeds size limit

**Solution**: Update `.vscodeignore` to exclude:
- `node_modules` (bundled modules only)
- Source files (`src/**`)
- Development files (`.vscode-test`, `tsconfig.json`)
- Examples directory (if very large)

Consider using webpack to bundle:
```bash
npm install --save-dev webpack webpack-cli ts-loader
```

---

## Marketplace Best Practices

### 1. Add Screenshots

Create screenshots showing:
- Exercise tree view
- Webview with instructions
- Test output
- AI hint generation

Add to README.md:
```markdown
## Screenshots

![Exercise List](images/screenshot1.png)
![Webview Panel](images/screenshot2.png)
```

### 2. Create a Demo Video

Record a short video (2-3 minutes):
- Opening a course
- Completing an exercise
- Getting a hint
- Progress tracking

Upload to YouTube and add to README.

### 3. Add Badges

In README.md:
```markdown
[![Version](https://img.shields.io/visual-studio-marketplace/v/ArturKot.learn-programming)](https://marketplace.visualstudio.com/items?itemName=ArturKot.learn-programming)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/ArturKot.learn-programming)](https://marketplace.visualstudio.com/items?itemName=ArturKot.learn-programming)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/ArturKot.learn-programming)](https://marketplace.visualstudio.com/items?itemName=ArturKot.learn-programming)
```

### 4. Respond to Reviews

Monitor marketplace reviews and respond to:
- Bug reports
- Feature requests
- Questions
- Positive feedback

### 5. Analytics

Check your extension's analytics:
1. Go to [Marketplace Publisher Management](https://marketplace.visualstudio.com/manage)
2. Click on your extension
3. View:
   - Install count
   - Rating
   - Reviews
   - Acquisition trends

---

## Next Steps

1. **Build Community**
   - Create Discord server for course creators
   - Set up GitHub Discussions
   - Write blog posts about creating courses

2. **Create More Courses**
   - Python basics
   - Go fundamentals
   - Rust introduction
   - Advanced JavaScript

3. **Add Features**
   - Course marketplace
   - Cloud sync
   - Leaderboards
   - Video tutorials

4. **Promote**
   - Submit to "VS Code Can Do That" newsletter
   - Tweet with #VSCode hashtag
   - Create tutorial videos
   - Write technical articles

---

## Important Links

- **Marketplace**: https://marketplace.visualstudio.com/
- **Publisher Management**: https://marketplace.visualstudio.com/manage
- **Azure DevOps**: https://dev.azure.com
- **VS Code Extension API**: https://code.visualstudio.com/api
- **Publishing Docs**: https://code.visualstudio.com/api/working-with-extensions/publishing-extension

---

## Support

If you encounter issues during publishing:

1. Check [vsce documentation](https://github.com/microsoft/vscode-vsce)
2. Search [VS Code extension issues](https://github.com/microsoft/vscode/issues)
3. Ask on [Stack Overflow](https://stackoverflow.com/questions/tagged/visual-studio-code)
4. Join [VS Code Dev Community](https://aka.ms/vscode-dev-community)

---

**Congratulations on publishing your extension!** 🎉

Remember to maintain it, respond to users, and keep adding awesome features!

---

*Last updated: 2025-10-20*
