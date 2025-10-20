import * as vscode from 'vscode';
import * as path from 'path';
import { CourseManager } from './courseManager';
import { ProgressTracker } from './progressTracker';
import { ExerciseTreeDataProvider } from './exerciseProvider';
import { TestRunner } from './testRunner';
import { ExerciseWebviewProvider } from './webviewProvider';
import { HintProvider } from './hintProvider';
import { BatchTestRunner } from './batchTestRunner';
import { Exercise } from './types';

let courseManager: CourseManager;
let progressTracker: ProgressTracker;
let exerciseProvider: ExerciseTreeDataProvider;
let testRunner: TestRunner;
let webviewProvider: ExerciseWebviewProvider;
let hintProvider: HintProvider;
let batchTestRunner: BatchTestRunner;
let currentExercise: Exercise | undefined;

export async function activate(context: vscode.ExtensionContext) {
  console.log('Learn Programming extension is now active');

  // Get workspace folder
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    vscode.window.showErrorMessage('Please open a workspace folder to use Learn Programming');
    return;
  }

  const workspacePath = workspaceFolders[0].uri.fsPath;

  try {
    // Initialize managers
    courseManager = new CourseManager(workspacePath);
    const course = await courseManager.loadCourse();

    progressTracker = new ProgressTracker(context, course.name);
    await progressTracker.initialize();

    testRunner = new TestRunner(workspacePath, progressTracker);
    hintProvider = new HintProvider(progressTracker);

    // Initialize providers
    exerciseProvider = new ExerciseTreeDataProvider(courseManager, progressTracker);
    batchTestRunner = new BatchTestRunner(context, testRunner, exerciseProvider);

    webviewProvider = new ExerciseWebviewProvider(
      context,
      (exercise) => runTests(exercise),
      (exercise) => showHint(exercise),
      () => vscode.commands.executeCommand('learnProgramming.nextExercise')
    );

    // Register tree view
    const treeView = vscode.window.createTreeView('exerciseList', {
      treeDataProvider: exerciseProvider,
      showCollapseAll: false
    });

    // Update tree view description with progress
    updateTreeViewDescription(treeView);

    context.subscriptions.push(treeView);

    // Register commands
    context.subscriptions.push(
      vscode.commands.registerCommand('learnProgramming.openCourse', async () => {
        try {
          await courseManager.loadCourse();
          exerciseProvider.refresh();
          vscode.window.showInformationMessage('Course reloaded successfully');
        } catch (error) {
          vscode.window.showErrorMessage(
            `Failed to reload course: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      })
    );

    context.subscriptions.push(
      vscode.commands.registerCommand('learnProgramming.openExercise', async (exercise: Exercise) => {
        console.log('openExercise called with:', exercise);
        console.log('Exercise structure:', JSON.stringify(exercise, null, 2));
        currentExercise = exercise;

        // Open exercise file in editor
        const config = vscode.workspace.getConfiguration('learnProgramming');
        const autoOpen = config.get<boolean>('autoOpenExercise', true);

        if (autoOpen) {
          // Convert file path to URI for proper file system synchronization
          const fileUri = vscode.Uri.file(exercise.exerciseFile);
          const doc = await vscode.workspace.openTextDocument(fileUri);
          await vscode.window.showTextDocument(doc, {
            viewColumn: vscode.ViewColumn.One,
            preview: false // Ensure file opens in a permanent tab, not preview mode
          });
        }

        // Show webview with instructions
        await webviewProvider.show(exercise);
      })
    );

    context.subscriptions.push(
      vscode.commands.registerCommand('learnProgramming.runTests', async (exerciseOrTreeItem?: any) => {
        console.log('runTests command called with:', exerciseOrTreeItem);

        // Check if batch tests are running
        if (batchTestRunner.isTestRunning()) {
          vscode.window.showWarningMessage(
            'Cannot run individual test: "Run All Tests" is currently in progress. Please wait or cancel the batch run.'
          );
          return;
        }

        // Handle different argument types
        let targetExercise: Exercise | undefined;

        if (exerciseOrTreeItem) {
          // Check if it's a TreeItem (from inline button) or Exercise (from other sources)
          if ('exercise' in exerciseOrTreeItem) {
            // It's an ExerciseTreeItem
            console.log('Received ExerciseTreeItem, extracting exercise');
            targetExercise = exerciseOrTreeItem.exercise;
          } else if ('id' in exerciseOrTreeItem && 'title' in exerciseOrTreeItem) {
            // It's an Exercise object directly
            console.log('Received Exercise object directly');
            targetExercise = exerciseOrTreeItem;
          }
        }

        // Fall back to currentExercise if no valid exercise found
        if (!targetExercise) {
          targetExercise = currentExercise;
        }

        if (!targetExercise) {
          vscode.window.showWarningMessage('Please select an exercise first');
          return;
        }

        const course = courseManager.getCourse();
        if (!course) {
          vscode.window.showErrorMessage('No course loaded');
          return;
        }

        await runTests(targetExercise);
      })
    );

    context.subscriptions.push(
      vscode.commands.registerCommand('learnProgramming.showHint', async (exerciseOrTreeItem?: any) => {
        // Handle different argument types
        let targetExercise: Exercise | undefined;

        if (exerciseOrTreeItem) {
          // Check if it's a TreeItem (from inline button) or Exercise (from other sources)
          if ('exercise' in exerciseOrTreeItem) {
            // It's an ExerciseTreeItem
            targetExercise = exerciseOrTreeItem.exercise;
          } else if ('id' in exerciseOrTreeItem && 'title' in exerciseOrTreeItem) {
            // It's an Exercise object directly
            targetExercise = exerciseOrTreeItem;
          }
        }

        // Fall back to currentExercise if no valid exercise found
        if (!targetExercise) {
          targetExercise = currentExercise;
        }

        if (!targetExercise) {
          vscode.window.showWarningMessage('Please select an exercise first');
          return;
        }

        await showHint(targetExercise);
      })
    );

    context.subscriptions.push(
      vscode.commands.registerCommand('learnProgramming.nextExercise', async () => {
        if (!currentExercise) {
          // Open first incomplete exercise
          const exercise = await getFirstIncompleteExercise();
          if (exercise) {
            await vscode.commands.executeCommand('learnProgramming.openExercise', exercise);
          }
          return;
        }

        const nextExercise = courseManager.getNextExercise(currentExercise.id);
        if (nextExercise) {
          // Check if unlocked
          const exerciseIds = courseManager.getExercises().map(ex => ex.id);
          const index = courseManager.getExerciseIndex(nextExercise.id);
          const isUnlocked = await progressTracker.isExerciseUnlocked(index, exerciseIds);

          if (isUnlocked) {
            await vscode.commands.executeCommand('learnProgramming.openExercise', nextExercise);
          } else {
            vscode.window.showInformationMessage(
              'Complete the current exercise to unlock the next one'
            );
          }
        } else {
          vscode.window.showInformationMessage('You have completed all exercises! 🎉');
        }
      })
    );

    context.subscriptions.push(
      vscode.commands.registerCommand('learnProgramming.previousExercise', async () => {
        if (!currentExercise) {
          return;
        }

        const prevExercise = courseManager.getPreviousExercise(currentExercise.id);
        if (prevExercise) {
          await vscode.commands.executeCommand('learnProgramming.openExercise', prevExercise);
        } else {
          vscode.window.showInformationMessage('This is the first exercise');
        }
      })
    );

    context.subscriptions.push(
      vscode.commands.registerCommand('learnProgramming.runAllTests', async () => {
        const course = courseManager.getCourse();
        if (!course) {
          vscode.window.showErrorMessage('No course loaded');
          return;
        }

        const exercises = courseManager.getExercises();
        if (exercises.length === 0) {
          vscode.window.showInformationMessage('No exercises found');
          return;
        }

        await batchTestRunner.runAllTests(exercises, course.language);
      })
    );

    context.subscriptions.push(
      vscode.commands.registerCommand('learnProgramming.resetProgress', async () => {
        const confirm = await vscode.window.showWarningMessage(
          'Are you sure you want to reset all progress? This cannot be undone.',
          { modal: true },
          'Reset Progress'
        );

        if (confirm === 'Reset Progress') {
          await progressTracker.resetProgress();
          exerciseProvider.refresh();
          await updateTreeViewDescription(treeView);
          vscode.window.showInformationMessage('Progress reset successfully');
        }
      })
    );

    context.subscriptions.push(
      vscode.commands.registerCommand('learnProgramming.refreshExercises', () => {
        exerciseProvider.refresh();
        updateTreeViewDescription(treeView);
      })
    );

    // Show welcome message
    vscode.window.showInformationMessage(
      `Welcome to ${course.name}! Click on an exercise to get started.`,
      'Start Learning'
    ).then(async selection => {
      if (selection === 'Start Learning') {
        const exercise = await getFirstIncompleteExercise();
        if (exercise) {
          vscode.commands.executeCommand('learnProgramming.openExercise', exercise);
        }
      }
    });

  } catch (error) {
    vscode.window.showErrorMessage(
      `Failed to initialize extension: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function runTests(exercise: Exercise): Promise<void> {
  // Debug: Log exercise object
  console.log('runTests called with exercise:', exercise);
  console.log('Exercise ID:', exercise?.id);
  console.log('Exercise title:', exercise?.title);

  if (!exercise) {
    vscode.window.showErrorMessage('No exercise provided to runTests');
    return;
  }

  const course = courseManager.getCourse();
  if (!course) {
    return;
  }

  try {
    await testRunner.runTest(exercise, course.language);
    exerciseProvider.refresh();

    // Update tree view description
    const treeView = vscode.window.createTreeView('exerciseList', {
      treeDataProvider: exerciseProvider
    });
    await updateTreeViewDescription(treeView);
  } catch (error) {
    vscode.window.showErrorMessage(
      `Failed to run tests: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function showHint(exercise: Exercise): Promise<void> {
  await hintProvider.generateHint(exercise);
}

async function updateTreeViewDescription(treeView: vscode.TreeView<any>): Promise<void> {
  const summary = await exerciseProvider.getProgressSummary();
  treeView.description = `${summary.completed}/${summary.total} (${summary.percentage}%)`;
}

async function getFirstIncompleteExercise(): Promise<Exercise | undefined> {
  const exercises = courseManager.getExercises();
  if (exercises.length === 0) {
    return undefined;
  }

  // Check each exercise to find first incomplete one
  for (const exercise of exercises) {
    const progress = await progressTracker.getProgress(exercise.id);
    if (!progress || !progress.completed) {
      return exercise;
    }
  }

  // All exercises completed, return first one
  return exercises[0];
}

export function deactivate() {
  if (testRunner) {
    testRunner.dispose();
  }
  if (progressTracker) {
    progressTracker.close();
  }
  if (webviewProvider) {
    webviewProvider.dispose();
  }
  if (batchTestRunner) {
    batchTestRunner.dispose();
  }
}
