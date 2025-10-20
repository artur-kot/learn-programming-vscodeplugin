import * as vscode from 'vscode';
import { Exercise, TestResult, TestOutput } from './types';
import { TestRunner } from './testRunner';
import { ExerciseTreeDataProvider } from './exerciseProvider';

export interface BatchTestProgress {
  total: number;
  completed: number;
  passed: number;
  failed: number;
  currentExercise?: Exercise;
  results: Map<string, TestOutput>;
  exercises: Exercise[];
}

export class BatchTestRunner {
  private panel: vscode.WebviewPanel | undefined;
  private isCancelled: boolean = false;
  private isRunning: boolean = false;

  constructor(
    private context: vscode.ExtensionContext,
    private testRunner: TestRunner,
    private exerciseProvider: ExerciseTreeDataProvider
  ) {}

  isTestRunning(): boolean {
    return this.isRunning;
  }

  async runAllTests(exercises: Exercise[], courseLanguage: string): Promise<void> {
    this.isCancelled = false;
    this.isRunning = true;

    // Create or show webview panel
    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.Two);
    } else {
      this.panel = vscode.window.createWebviewPanel(
        'batchTestProgress',
        'Running All Tests',
        vscode.ViewColumn.Two,
        {
          enableScripts: true,
          retainContextWhenHidden: true
        }
      );

      this.panel.onDidDispose(() => {
        this.panel = undefined;
        this.isCancelled = true;
        this.isRunning = false;
      });

      this.panel.webview.onDidReceiveMessage(
        message => {
          switch (message.command) {
            case 'cancel':
              this.cancel();
              break;
          }
        },
        undefined,
        this.context.subscriptions
      );
    }

    const progress: BatchTestProgress = {
      total: exercises.length,
      completed: 0,
      passed: 0,
      failed: 0,
      results: new Map(),
      exercises: exercises
    };

    this.updateWebview(progress, false);

    // Run tests one by one
    for (const exercise of exercises) {
      if (this.isCancelled) {
        this.updateWebview(progress, true, 'Tests cancelled by user');
        this.isRunning = false;
        return;
      }

      progress.currentExercise = exercise;
      this.updateWebview(progress, false);

      try {
        const result = await this.testRunner.runTest(exercise, courseLanguage, { silent: true });
        progress.results.set(exercise.id, result);

        if (result.result === TestResult.Passed) {
          progress.passed++;
        } else if (result.result === TestResult.Failed) {
          progress.failed++;
        }
      } catch (error) {
        progress.results.set(exercise.id, {
          result: TestResult.Error,
          output: error instanceof Error ? error.message : String(error),
          exitCode: -1
        });
        progress.failed++;
      }

      progress.completed++;
      this.updateWebview(progress, false);

      // Refresh the exercise list to update status
      this.exerciseProvider.refresh();
    }

    // All tests complete
    this.updateWebview(progress, true);
    this.isRunning = false;
  }

  private cancel(): void {
    this.isCancelled = true;
    this.isRunning = false;
    this.testRunner.cancelRunningTest();
    vscode.window.showInformationMessage('Batch test run cancelled');
  }

  private updateWebview(progress: BatchTestProgress, isComplete: boolean, message?: string): void {
    if (!this.panel) {
      return;
    }

    const percentage = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;
    const htmlContent = this.generateHtml(progress, percentage, isComplete, message);
    this.panel.webview.html = htmlContent;
  }

  private generateHtml(
    progress: BatchTestProgress,
    percentage: number,
    isComplete: boolean,
    message?: string
  ): string {
    // Generate progress indicator boxes for each exercise
    const progressBoxesHtml = progress.exercises.map((exercise, index) => {
      const result = progress.results.get(exercise.id);
      let boxClass = 'pending';
      let icon = '';

      if (result) {
        // Test completed
        if (result.result === TestResult.Passed) {
          boxClass = 'passed';
          icon = '✓';
        } else {
          boxClass = 'failed';
          icon = '✗';
        }
      } else if (progress.currentExercise?.id === exercise.id) {
        // Currently running
        boxClass = 'running';
        icon = '⟳';
      }

      return `
        <div class="progress-box ${boxClass}">
          <div class="box-icon">${icon}</div>
          <div class="box-title">${exercise.title}</div>
        </div>
      `;
    }).join('');

    const progressText = `Ran tests for ${progress.completed} / ${progress.total} exercises (${percentage.toFixed(0)}%)`;

    const messageHtml = message
      ? `<p class="message">${message}</p>`
      : '';

    const cancelButton = !isComplete
      ? '<button class="btn btn-danger" onclick="cancel()">Cancel</button>'
      : '';

    const summaryHtml = isComplete
      ? `
        <div class="summary">
          <h2>Test Summary</h2>
          <p>Total: ${progress.total}</p>
          <p class="passed">Passed: ${progress.passed}</p>
          <p class="failed">Failed: ${progress.failed}</p>
        </div>
      `
      : '';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: var(--vscode-font-family);
              padding: 20px;
              color: var(--vscode-foreground);
              background-color: var(--vscode-editor-background);
            }

            h1 {
              margin-bottom: 20px;
            }

            .progress-text {
              font-size: 16px;
              font-weight: bold;
              margin: 20px 0 10px 0;
              text-align: center;
            }

            .progress-boxes {
              display: flex;
              flex-direction: column;
              gap: 10px;
              margin: 20px 0;
            }

            .progress-box {
              display: flex;
              align-items: center;
              padding: 15px;
              border-radius: 6px;
              border: 2px solid var(--vscode-widget-border);
              background-color: var(--vscode-editor-background);
              transition: all 0.3s ease;
            }

            .progress-box.pending {
              opacity: 0.5;
              border-color: var(--vscode-descriptionForeground);
            }

            .progress-box.running {
              border-color: var(--vscode-charts-blue);
              background-color: rgba(0, 122, 204, 0.1);
              animation: pulse 1.5s ease-in-out infinite;
            }

            .progress-box.passed {
              border-color: var(--vscode-charts-green);
              background-color: rgba(0, 255, 0, 0.05);
            }

            .progress-box.failed {
              border-color: var(--vscode-charts-red);
              background-color: rgba(255, 0, 0, 0.05);
            }

            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.6; }
            }

            .box-icon {
              font-size: 24px;
              font-weight: bold;
              margin-right: 15px;
              min-width: 30px;
              text-align: center;
            }

            .progress-box.running .box-icon {
              color: var(--vscode-charts-blue);
              animation: spin 2s linear infinite;
            }

            .progress-box.passed .box-icon {
              color: var(--vscode-charts-green);
            }

            .progress-box.failed .box-icon {
              color: var(--vscode-charts-red);
            }

            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }

            .box-title {
              font-size: 14px;
              flex: 1;
            }

            .message {
              color: var(--vscode-errorForeground);
              font-weight: bold;
              margin: 10px 0;
              text-align: center;
            }

            .btn {
              padding: 10px 20px;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 14px;
              margin-top: 20px;
              font-weight: bold;
            }

            .btn-danger {
              background-color: var(--vscode-button-background);
              color: var(--vscode-button-foreground);
            }

            .btn-danger:hover {
              background-color: var(--vscode-button-hoverBackground);
            }

            .btn-danger:active {
              transform: scale(0.98);
            }

            .summary {
              margin-top: 30px;
              padding: 20px;
              background-color: var(--vscode-editor-inactiveSelectionBackground);
              border-radius: 4px;
            }

            .summary h2 {
              margin-top: 0;
            }

            .summary .passed {
              color: var(--vscode-charts-green);
            }

            .summary .failed {
              color: var(--vscode-charts-red);
            }
          </style>
        </head>
        <body>
          <h1>Running All Tests</h1>

          <div class="progress-text">${progressText}</div>

          ${messageHtml}

          <div class="progress-boxes">
            ${progressBoxesHtml}
          </div>

          ${cancelButton}
          ${summaryHtml}

          <script>
            const vscode = acquireVsCodeApi();

            function cancel() {
              vscode.postMessage({ command: 'cancel' });
            }
          </script>
        </body>
      </html>
    `;
  }

  dispose(): void {
    if (this.panel) {
      this.panel.dispose();
      this.panel = undefined;
    }
  }
}
