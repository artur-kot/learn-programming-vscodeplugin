import * as vscode from 'vscode';
import * as fs from 'fs';
import fetch from 'node-fetch';
import { Exercise } from './types';
import { ProgressTracker } from './progressTracker';

export class HintProvider {
  constructor(private progressTracker: ProgressTracker) {}

  async generateHint(exercise: Exercise, testOutput?: string): Promise<void> {
    const config = vscode.workspace.getConfiguration('learnProgramming');
    const enableHints = config.get<boolean>('enableHints', true);

    if (!enableHints) {
      vscode.window.showInformationMessage('AI hints are disabled in settings.');
      return;
    }

    const ollamaUrl = config.get<string>('ollamaUrl', 'http://localhost:11434');
    const model = config.get<string>('ollamaModel', 'llama2');

    // Check Ollama availability
    const available = await this.checkOllamaAvailability(ollamaUrl);
    if (!available) {
      const choice = await vscode.window.showErrorMessage(
        'Ollama is not running or not accessible. Please start Ollama to use AI hints.',
        'Open Ollama Settings',
        'Learn More'
      );

      if (choice === 'Open Ollama Settings') {
        vscode.commands.executeCommand('workbench.action.openSettings', 'learnProgramming.ollama');
      } else if (choice === 'Learn More') {
        vscode.env.openExternal(vscode.Uri.parse('https://ollama.ai'));
      }
      return;
    }

    // Read exercise code
    let exerciseCode = '';
    if (fs.existsSync(exercise.exerciseFile)) {
      exerciseCode = fs.readFileSync(exercise.exerciseFile, 'utf-8');
    }

    // Build prompt
    const prompt = this.buildPrompt(exercise, exerciseCode, testOutput);

    // Show progress
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Generating hint...',
        cancellable: false
      },
      async () => {
        try {
          const hint = await this.callOllama(ollamaUrl, model, prompt);

          // Increment hints used counter
          await this.progressTracker.incrementHintsUsed();

          // Display hint
          this.displayHint(exercise, hint);
        } catch (error) {
          vscode.window.showErrorMessage(
            `Failed to generate hint: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }
    );
  }

  private async checkOllamaAvailability(ollamaUrl: string): Promise<boolean> {
    try {
      const response = await fetch(`${ollamaUrl}/api/tags`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  private buildPrompt(exercise: Exercise, exerciseCode: string, testOutput?: string): string {
    let prompt = `You are a helpful and encouraging programming tutor. A student is working on the following exercise:

Exercise: ${exercise.title}
Description: ${exercise.description}

Current code:
\`\`\`
${exerciseCode}
\`\`\`
`;

    if (testOutput) {
      prompt += `\nTest output showing failures:
\`\`\`
${testOutput}
\`\`\`
`;
    }

    prompt += `\nProvide a helpful hint (NOT the full solution) to guide the student toward fixing the issue. Be encouraging, educational, and focus on the concepts they need to understand. Keep your hint concise (2-4 sentences).

Hint:`;

    return prompt;
  }

  private async callOllama(ollamaUrl: string, model: string, prompt: string): Promise<string> {
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json() as any;
    return data.response || 'No hint generated';
  }

  private displayHint(exercise: Exercise, hint: string): void {
    const panel = vscode.window.createWebviewPanel(
      'exerciseHint',
      `Hint: ${exercise.title}`,
      vscode.ViewColumn.Beside,
      {
        enableScripts: false
      }
    );

    panel.webview.html = this.getHintWebviewContent(exercise, hint);
  }

  private getHintWebviewContent(exercise: Exercise, hint: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hint</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background-color: var(--vscode-editor-background);
      padding: 24px;
      line-height: 1.6;
    }

    .hint-container {
      max-width: 700px;
      margin: 0 auto;
    }

    .hint-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    h1 {
      font-size: 20px;
      margin: 0 0 8px 0;
      font-weight: 600;
    }

    .exercise-title {
      color: var(--vscode-descriptionForeground);
      font-size: 14px;
      margin-bottom: 24px;
    }

    .hint-content {
      background: var(--vscode-textCodeBlock-background);
      border-left: 4px solid var(--vscode-textLink-foreground);
      padding: 16px 20px;
      border-radius: 4px;
      white-space: pre-wrap;
      line-height: 1.8;
    }

    .hint-footer {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid var(--vscode-panel-border);
      color: var(--vscode-descriptionForeground);
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="hint-container">
    <div class="hint-icon">💡</div>
    <h1>AI-Generated Hint</h1>
    <div class="exercise-title">For: ${exercise.title}</div>

    <div class="hint-content">${this.escapeHtml(hint)}</div>

    <div class="hint-footer">
      Remember: The best way to learn is by trying different approaches.
      Use this hint as a guide, not as the complete answer.
    </div>
  </div>
</body>
</html>`;
  }

  private escapeHtml(text: string): string {
    const div = { textContent: text } as any;
    return div.innerHTML || text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
