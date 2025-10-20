import * as vscode from 'vscode';
import { spawn, ChildProcess } from 'child_process';
import { Exercise, TestResult, TestOutput, LANGUAGE_CONFIGS } from './types';
import { ProgressTracker } from './progressTracker';
import * as path from 'path';

export class TestRunner {
  private currentProcess: ChildProcess | null = null;
  private outputChannel: vscode.OutputChannel;

  constructor(
    private workspacePath: string,
    private progressTracker: ProgressTracker
  ) {
    this.outputChannel = vscode.window.createOutputChannel('Learn Programming: Tests');
  }

  async runTest(exercise: Exercise, courseLanguage: string, options?: { silent?: boolean }): Promise<TestOutput> {
    const silent = options?.silent || false;

    // Validate exercise object
    if (!exercise || !exercise.id || !exercise.title) {
      const error = 'Invalid exercise object - exercise data is missing';
      this.outputChannel.clear();
      this.outputChannel.show(true);
      this.outputChannel.appendLine(`Error: ${error}`);
      throw new Error(error);
    }

    // Cancel any running test
    this.cancelRunningTest();

    const langConfig = LANGUAGE_CONFIGS[courseLanguage as keyof typeof LANGUAGE_CONFIGS];
    if (!langConfig) {
      throw new Error(`Unsupported language: ${courseLanguage}`);
    }

    if (!silent) {
      this.outputChannel.clear();
      this.outputChannel.show(true);
    }
    this.outputChannel.appendLine(`Running tests for: ${exercise.title}\n`);
    this.outputChannel.appendLine(`Exercise ID: ${exercise.id}`);
    this.outputChannel.appendLine(`Test file: ${exercise.testFile}`);
    this.outputChannel.appendLine(`Working directory: ${this.workspacePath}\n`);
    this.outputChannel.appendLine('='.repeat(60));

    // For silent mode, skip the progress notification
    if (silent) {
      const result = await this.executeTest(exercise, langConfig, undefined);

      // Update progress tracker
      await this.progressTracker.incrementTestRuns();

      if (result.result === TestResult.Passed) {
        await this.progressTracker.markCompleted(exercise.id);
      } else if (result.result === TestResult.Failed) {
        await this.progressTracker.markAttempted(exercise.id);
      }

      return result;
    }

    return vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Running tests for ${exercise.title}`,
        cancellable: true
      },
      async (progress, token) => {
        // Handle cancellation
        token.onCancellationRequested(() => {
          this.cancelRunningTest();
        });

        const result = await this.executeTest(exercise, langConfig, progress);

        // Update progress tracker
        await this.progressTracker.incrementTestRuns();

        if (result.result === TestResult.Passed) {
          await this.progressTracker.markCompleted(exercise.id);
          if (!silent) {
            vscode.window.showInformationMessage(
              `✓ ${exercise.title} completed! Tests passed.`,
              'Next Exercise'
            ).then(selection => {
              if (selection === 'Next Exercise') {
                vscode.commands.executeCommand('learnProgramming.nextExercise');
              }
            });
          }
        } else if (result.result === TestResult.Failed) {
          await this.progressTracker.markAttempted(exercise.id);
          if (!silent) {
            vscode.window.showErrorMessage(
              `✗ Tests failed for ${exercise.title}`,
              'Get Hint',
              'Try Again'
            ).then(selection => {
              if (selection === 'Get Hint') {
                vscode.commands.executeCommand('learnProgramming.showHint', exercise);
              } else if (selection === 'Try Again') {
                vscode.commands.executeCommand('learnProgramming.runTests', exercise);
              }
            });
          }
        } else {
          if (!silent) {
            vscode.window.showErrorMessage(`Error running tests: ${result.output}`);
          }
        }

        return result;
      }
    );
  }

  private async executeTest(
    exercise: Exercise,
    langConfig: any,
    progress?: vscode.Progress<{ message?: string; increment?: number }>
  ): Promise<TestOutput> {
    return new Promise((resolve) => {
      let output = '';
      const command = langConfig.testCommand[0];
      const args = this.buildTestArgs(exercise, langConfig);

      progress?.report({ message: 'Starting tests...' });

      this.currentProcess = spawn(command, args, {
        cwd: this.workspacePath,
        shell: true,
        env: { ...process.env, FORCE_COLOR: '0' }
      });

      this.currentProcess.stdout?.on('data', (data: Buffer) => {
        const text = data.toString();
        output += text;
        this.outputChannel.append(text);
        progress?.report({ message: 'Running tests...' });
      });

      this.currentProcess.stderr?.on('data', (data: Buffer) => {
        const text = data.toString();
        output += text;
        this.outputChannel.append(text);
      });

      this.currentProcess.on('error', (error) => {
        this.outputChannel.appendLine(`\nError: ${error.message}`);
        resolve({
          result: TestResult.Error,
          output: error.message,
          exitCode: -1
        });
      });

      this.currentProcess.on('close', (code) => {
        this.currentProcess = null;

        this.outputChannel.appendLine('\n' + '='.repeat(60));

        const result = code === 0 ? TestResult.Passed : TestResult.Failed;

        if (result === TestResult.Passed) {
          this.outputChannel.appendLine('✓ All tests passed!');
        } else {
          this.outputChannel.appendLine(`✗ Tests failed (exit code: ${code})`);
        }

        resolve({
          result,
          output,
          exitCode: code || 0
        });
      });
    });
  }

  private buildTestArgs(exercise: Exercise, langConfig: any): string[] {
    const args = [...langConfig.testCommand.slice(1)];

    switch (langConfig.language) {
      case 'javascript':
        // Jest: run specific test file using relative path
        const relativeTestPath = path.relative(this.workspacePath, exercise.testFile);
        // Normalize path separators for Jest (use forward slashes)
        const normalizedPath = relativeTestPath.replace(/\\/g, '/');
        args.push('--testPathPattern', normalizedPath);
        args.push('--no-coverage');
        break;

      case 'python':
        // pytest: run specific test file
        args.push(path.relative(this.workspacePath, exercise.testFile));
        break;

      case 'go':
        // go test: run tests in exercise directory
        args.push(path.relative(this.workspacePath, exercise.path));
        break;

      case 'rust':
        // cargo test: run specific test
        args.push('--test', exercise.id);
        break;
    }

    return args;
  }

  cancelRunningTest(): void {
    if (this.currentProcess) {
      this.currentProcess.kill();
      this.currentProcess = null;
      this.outputChannel.appendLine('\n\nTest execution cancelled by user.');
    }
  }

  dispose(): void {
    this.cancelRunningTest();
    this.outputChannel.dispose();
  }
}
