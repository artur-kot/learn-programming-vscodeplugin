import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as sqlite3 from 'sqlite3';
import { ExerciseProgress, ExerciseStatus } from './types';

export class ProgressTracker {
  private db: sqlite3.Database | null = null;
  private dbPath: string;

  constructor(private context: vscode.ExtensionContext, private courseName: string) {
    const storageUri = context.globalStorageUri;
    const storagePath = storageUri.fsPath;

    // Ensure storage directory exists
    if (!fs.existsSync(storagePath)) {
      fs.mkdirSync(storagePath, { recursive: true });
    }

    // Create database file path (one per course)
    const sanitizedCourseName = courseName.replace(/[^a-zA-Z0-9]/g, '_');
    this.dbPath = path.join(storagePath, `${sanitizedCourseName}.db`);
  }

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          reject(err);
          return;
        }

        this.createTables()
          .then(() => resolve())
          .catch(reject);
      });
    });
  }

  private async createTables(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const schema = `
      CREATE TABLE IF NOT EXISTS exercise_progress (
        exercise_id TEXT PRIMARY KEY,
        completed INTEGER NOT NULL DEFAULT 0,
        last_attempt TEXT,
        completed_at TEXT
      );

      CREATE TABLE IF NOT EXISTS course_metadata (
        course_name TEXT PRIMARY KEY,
        last_loaded TEXT,
        total_exercises INTEGER,
        completed_exercises INTEGER
      );

      CREATE TABLE IF NOT EXISTS user_preferences (
        course_name TEXT PRIMARY KEY,
        last_exercise TEXT,
        hints_used INTEGER DEFAULT 0,
        total_test_runs INTEGER DEFAULT 0
      );
    `;

    return new Promise((resolve, reject) => {
      this.db!.exec(schema, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async markCompleted(exerciseId: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const now = new Date().toISOString();

    return new Promise((resolve, reject) => {
      this.db!.run(
        `INSERT OR REPLACE INTO exercise_progress
         (exercise_id, completed, last_attempt, completed_at)
         VALUES (?, 1, ?, ?)`,
        [exerciseId, now, now],
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  async markAttempted(exerciseId: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const now = new Date().toISOString();

    return new Promise((resolve, reject) => {
      this.db!.run(
        `INSERT OR REPLACE INTO exercise_progress
         (exercise_id, completed, last_attempt)
         VALUES (?, 0, ?)`,
        [exerciseId, now],
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  async getProgress(exerciseId: string): Promise<ExerciseProgress | null> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      this.db!.get(
        'SELECT * FROM exercise_progress WHERE exercise_id = ?',
        [exerciseId],
        (err, row: any) => {
          if (err) {
            reject(err);
          } else if (!row) {
            resolve(null);
          } else {
            resolve({
              exerciseId: row.exercise_id,
              completed: row.completed === 1,
              lastAttempt: row.last_attempt ? new Date(row.last_attempt) : undefined,
              completedAt: row.completed_at ? new Date(row.completed_at) : undefined
            });
          }
        }
      );
    });
  }

  async getAllProgress(): Promise<Map<string, ExerciseProgress>> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      this.db!.all(
        'SELECT * FROM exercise_progress',
        (err, rows: any[]) => {
          if (err) {
            reject(err);
          } else {
            const progressMap = new Map<string, ExerciseProgress>();
            for (const row of rows) {
              progressMap.set(row.exercise_id, {
                exerciseId: row.exercise_id,
                completed: row.completed === 1,
                lastAttempt: row.last_attempt ? new Date(row.last_attempt) : undefined,
                completedAt: row.completed_at ? new Date(row.completed_at) : undefined
              });
            }
            resolve(progressMap);
          }
        }
      );
    });
  }

  async isExerciseUnlocked(exerciseIndex: number, allExercises: string[]): Promise<boolean> {
    // First exercise is always unlocked
    if (exerciseIndex === 0) {
      return true;
    }

    // Check if all previous exercises are completed
    for (let i = 0; i < exerciseIndex; i++) {
      const progress = await this.getProgress(allExercises[i]);
      if (!progress || !progress.completed) {
        return false;
      }
    }

    return true;
  }

  async getExerciseStatus(exerciseId: string, exerciseIndex: number, allExercises: string[]): Promise<ExerciseStatus> {
    const isUnlocked = await this.isExerciseUnlocked(exerciseIndex, allExercises);

    if (!isUnlocked) {
      return ExerciseStatus.Locked;
    }

    const progress = await this.getProgress(exerciseId);

    if (!progress) {
      return ExerciseStatus.Available;
    }

    if (progress.completed) {
      return ExerciseStatus.Completed;
    }

    return ExerciseStatus.InProgress;
  }

  async resetProgress(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      this.db!.run('DELETE FROM exercise_progress', (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async incrementTestRuns(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      this.db!.run(
        `INSERT OR REPLACE INTO user_preferences
         (course_name, total_test_runs)
         VALUES (?, COALESCE((SELECT total_test_runs FROM user_preferences WHERE course_name = ?), 0) + 1)`,
        [this.courseName, this.courseName],
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  async incrementHintsUsed(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      this.db!.run(
        `INSERT OR REPLACE INTO user_preferences
         (course_name, hints_used)
         VALUES (?, COALESCE((SELECT hints_used FROM user_preferences WHERE course_name = ?), 0) + 1)`,
        [this.courseName, this.courseName],
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
