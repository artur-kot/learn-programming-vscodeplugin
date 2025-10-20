import * as vscode from 'vscode';
import * as path from 'path';
import { Exercise, ExerciseStatus } from './types';
import { ProgressTracker } from './progressTracker';
import { CourseManager } from './courseManager';

export class ExerciseTreeItem extends vscode.TreeItem {
  constructor(
    public readonly exercise: Exercise,
    public readonly status: ExerciseStatus
  ) {
    super(exercise.title, vscode.TreeItemCollapsibleState.None);

    this.tooltip = exercise.description;
    this.description = this.getStatusDescription(status);
    this.iconPath = this.getIconForStatus(status);
    this.contextValue = status === ExerciseStatus.Locked ? 'locked' : 'unlocked';

    // Command to open exercise when clicked (only if unlocked)
    if (status !== ExerciseStatus.Locked) {
      this.command = {
        command: 'learnProgramming.openExercise',
        title: 'Open Exercise',
        arguments: [exercise]
      };
    }
  }

  private getStatusDescription(status: ExerciseStatus): string {
    switch (status) {
      case ExerciseStatus.Completed:
        return 'Completed';
      case ExerciseStatus.InProgress:
        return 'In Progress';
      case ExerciseStatus.Available:
        return 'Not Started';
      case ExerciseStatus.Locked:
        return 'Locked';
    }
  }

  private getIconForStatus(status: ExerciseStatus): vscode.ThemeIcon {
    switch (status) {
      case ExerciseStatus.Completed:
        return new vscode.ThemeIcon('pass', new vscode.ThemeColor('testing.iconPassed'));
      case ExerciseStatus.InProgress:
        return new vscode.ThemeIcon('circle-outline', new vscode.ThemeColor('testing.iconQueued'));
      case ExerciseStatus.Available:
        return new vscode.ThemeIcon('circle-outline');
      case ExerciseStatus.Locked:
        return new vscode.ThemeIcon('lock');
    }
  }
}

export class ExerciseTreeDataProvider implements vscode.TreeDataProvider<ExerciseTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<ExerciseTreeItem | undefined | null | void> =
    new vscode.EventEmitter<ExerciseTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<ExerciseTreeItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  constructor(
    private courseManager: CourseManager,
    private progressTracker: ProgressTracker
  ) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: ExerciseTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: ExerciseTreeItem): Promise<ExerciseTreeItem[]> {
    if (element) {
      return [];
    }

    const exercises = this.courseManager.getExercises();
    const exerciseIds = exercises.map(ex => ex.id);
    const items: ExerciseTreeItem[] = [];

    for (let i = 0; i < exercises.length; i++) {
      const exercise = exercises[i];
      const status = await this.progressTracker.getExerciseStatus(
        exercise.id,
        i,
        exerciseIds
      );

      items.push(new ExerciseTreeItem(exercise, status));
    }

    return items;
  }

  async getProgressSummary(): Promise<{ completed: number; total: number; percentage: number }> {
    const exercises = this.courseManager.getExercises();
    const progress = await this.progressTracker.getAllProgress();

    const completed = exercises.filter(ex => {
      const p = progress.get(ex.id);
      return p && p.completed;
    }).length;

    const total = exercises.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, total, percentage };
  }
}
