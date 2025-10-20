import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import MarkdownIt from 'markdown-it';
import { Exercise } from './types';

export class ExerciseWebviewProvider {
  private panel: vscode.WebviewPanel | undefined;
  private currentExercise: Exercise | undefined;
  private md: MarkdownIt;

  constructor(
    private context: vscode.ExtensionContext,
    private onRunTests: (exercise: Exercise) => void,
    private onShowHint: (exercise: Exercise) => void,
    private onNextExercise: () => void
  ) {
    this.md = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true
    });
  }

  async show(exercise: Exercise): Promise<void> {
    this.currentExercise = exercise;

    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.Two);
      this.updateContent(exercise);
    } else {
      this.panel = vscode.window.createWebviewPanel(
        'exerciseDetails',
        exercise.title,
        vscode.ViewColumn.Two,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots: [
            vscode.Uri.file(path.join(this.context.extensionPath, 'media'))
          ]
        }
      );

      this.panel.onDidDispose(() => {
        this.panel = undefined;
      });

      this.panel.webview.onDidReceiveMessage(
        message => {
          switch (message.command) {
            case 'runTests':
              if (this.currentExercise) {
                this.onRunTests(this.currentExercise);
              }
              break;
            case 'showHint':
              if (this.currentExercise) {
                this.onShowHint(this.currentExercise);
              }
              break;
            case 'nextExercise':
              this.onNextExercise();
              break;
          }
        },
        undefined,
        this.context.subscriptions
      );

      this.updateContent(exercise);
    }
  }

  private async updateContent(exercise: Exercise): Promise<void> {
    if (!this.panel) {
      return;
    }

    this.panel.title = exercise.title;

    // Read README content
    let readmeContent = '';
    if (exercise.readmeFile && fs.existsSync(exercise.readmeFile)) {
      readmeContent = fs.readFileSync(exercise.readmeFile, 'utf-8');
    } else {
      readmeContent = `# ${exercise.title}\n\n${exercise.description}`;
    }

    const htmlContent = this.md.render(readmeContent);
    this.panel.webview.html = this.getWebviewContent(exercise, htmlContent);
  }

  private getWebviewContent(exercise: Exercise, readmeHtml: string): string {
    const styleUri = this.panel?.webview.asWebviewUri(
      vscode.Uri.file(path.join(this.context.extensionPath, 'media', 'styles.css'))
    );

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${this.panel?.webview.cspSource} 'unsafe-inline'; script-src 'unsafe-inline';">
  <title>${exercise.title}</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background-color: var(--vscode-editor-background);
      padding: 0;
      margin: 0;
      line-height: 1.6;
    }

    .exercise-header {
      background: var(--vscode-editor-background);
      padding: 20px 24px;
      border-bottom: 1px solid var(--vscode-panel-border);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .exercise-header h1 {
      margin: 0 0 8px 0;
      font-size: 24px;
      font-weight: 600;
    }

    .exercise-header p {
      margin: 0;
      color: var(--vscode-descriptionForeground);
    }

    .readme-content {
      padding: 24px;
      max-width: 900px;
    }

    .readme-content h1, .readme-content h2, .readme-content h3 {
      color: var(--vscode-foreground);
      margin-top: 24px;
      margin-bottom: 12px;
    }

    .readme-content code {
      background: var(--vscode-textCodeBlock-background);
      padding: 2px 6px;
      border-radius: 3px;
      font-family: var(--vscode-editor-font-family);
      font-size: 0.9em;
    }

    .readme-content pre {
      background: var(--vscode-textCodeBlock-background);
      padding: 12px;
      border-radius: 4px;
      overflow-x: auto;
      border: 1px solid var(--vscode-panel-border);
    }

    .readme-content pre code {
      background: none;
      padding: 0;
    }

    .readme-content ul, .readme-content ol {
      padding-left: 24px;
    }

    .readme-content blockquote {
      border-left: 4px solid var(--vscode-textBlockQuote-border);
      background: var(--vscode-textBlockQuote-background);
      padding: 8px 16px;
      margin: 16px 0;
    }

    .actions {
      position: sticky;
      bottom: 0;
      background: var(--vscode-editor-background);
      padding: 16px 24px;
      border-top: 1px solid var(--vscode-panel-border);
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 2px;
      cursor: pointer;
      font-size: 13px;
      font-family: var(--vscode-font-family);
      transition: background-color 0.1s;
    }

    .btn-primary {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }

    .btn-primary:hover {
      background: var(--vscode-button-hoverBackground);
    }

    .btn-secondary {
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }

    .btn-secondary:hover {
      background: var(--vscode-button-secondaryHoverBackground);
    }

    .btn:active {
      transform: translateY(1px);
    }

    .spacer {
      flex: 1;
    }
  </style>
</head>
<body>
  <div class="exercise-header">
    <h1>${exercise.title}</h1>
    <p>${exercise.description}</p>
  </div>

  <div class="readme-content">
    ${readmeHtml}
  </div>

  <div class="actions">
    <button class="btn btn-primary" onclick="runTests()">
      ▶ Run Tests
    </button>
    <button class="btn btn-secondary" onclick="showHint()">
      💡 Get Hint
    </button>
    <div class="spacer"></div>
    <button class="btn btn-secondary" onclick="nextExercise()">
      Next Exercise →
    </button>
  </div>

  <script>
    const vscode = acquireVsCodeApi();

    function runTests() {
      vscode.postMessage({ command: 'runTests' });
    }

    function showHint() {
      vscode.postMessage({ command: 'showHint' });
    }

    function nextExercise() {
      vscode.postMessage({ command: 'nextExercise' });
    }
  </script>
</body>
</html>`;
  }

  dispose(): void {
    if (this.panel) {
      this.panel.dispose();
    }
  }
}
