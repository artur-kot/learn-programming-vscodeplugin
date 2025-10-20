import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { Course, Exercise, ExerciseMetadata, LANGUAGE_CONFIGS } from './types';

export class CourseManager {
  private course: Course | null = null;
  private exercises: Exercise[] = [];
  private workspacePath: string;

  constructor(workspacePath: string) {
    this.workspacePath = workspacePath;
  }

  async loadCourse(): Promise<Course> {
    const courseJsonPath = path.join(this.workspacePath, 'course.json');

    if (!fs.existsSync(courseJsonPath)) {
      throw new Error('course.json not found in workspace');
    }

    const courseData = fs.readFileSync(courseJsonPath, 'utf-8');
    this.course = JSON.parse(courseData) as Course;

    // Validate course structure
    if (!this.validateCourseStructure()) {
      throw new Error('Invalid course structure');
    }

    // Load exercises
    await this.loadExercises();

    return this.course;
  }

  private validateCourseStructure(): boolean {
    if (!this.course) {
      return false;
    }

    const requiredFields = ['name', 'description', 'author', 'version', 'language', 'exercises'];
    for (const field of requiredFields) {
      if (!(field in this.course)) {
        return false;
      }
    }

    // Validate language is supported
    if (!LANGUAGE_CONFIGS[this.course.language]) {
      vscode.window.showErrorMessage(`Unsupported language: ${this.course.language}`);
      return false;
    }

    return true;
  }

  private async loadExercises(): Promise<void> {
    if (!this.course) {
      return;
    }

    this.exercises = [];
    const langConfig = LANGUAGE_CONFIGS[this.course.language];

    for (const metadata of this.course.exercises) {
      const exercisePath = path.join(this.workspacePath, 'exercises', metadata.id);

      if (!fs.existsSync(exercisePath)) {
        vscode.window.showWarningMessage(`Exercise directory not found: ${metadata.id}`);
        continue;
      }

      // Find exercise file
      const exerciseFile = this.findFileInDirectory(
        exercisePath,
        `exercise${langConfig.exerciseFileExtension}`
      );

      // Find test file
      const testFile = this.findFileInDirectory(
        exercisePath,
        langConfig.testFilePattern.replace('*', metadata.id)
      );

      // Find README
      const readmeFile = this.findFileInDirectory(exercisePath, 'README.md');

      if (!exerciseFile || !testFile) {
        vscode.window.showWarningMessage(
          `Missing files for exercise: ${metadata.id}`
        );
        continue;
      }

      const exercise: Exercise = {
        ...metadata,
        path: exercisePath,
        exerciseFile,
        testFile,
        readmeFile: readmeFile || ''
      };

      this.exercises.push(exercise);
    }

    // Sort by order
    this.exercises.sort((a, b) => a.order - b.order);
  }

  private findFileInDirectory(dir: string, pattern: string): string {
    const files = fs.readdirSync(dir);

    // Exact match first
    if (files.includes(pattern)) {
      return path.join(dir, pattern);
    }

    // Pattern matching
    const regex = new RegExp(pattern.replace('*', '.*'));
    const match = files.find(file => regex.test(file));

    return match ? path.join(dir, match) : '';
  }

  getCourse(): Course | null {
    return this.course;
  }

  getExercises(): Exercise[] {
    return this.exercises;
  }

  getExerciseById(id: string): Exercise | undefined {
    return this.exercises.find(ex => ex.id === id);
  }

  getExerciseByIndex(index: number): Exercise | undefined {
    return this.exercises[index];
  }

  getExerciseIndex(exerciseId: string): number {
    return this.exercises.findIndex(ex => ex.id === exerciseId);
  }

  getNextExercise(currentId: string): Exercise | undefined {
    const currentIndex = this.getExerciseIndex(currentId);
    if (currentIndex === -1 || currentIndex === this.exercises.length - 1) {
      return undefined;
    }
    return this.exercises[currentIndex + 1];
  }

  getPreviousExercise(currentId: string): Exercise | undefined {
    const currentIndex = this.getExerciseIndex(currentId);
    if (currentIndex <= 0) {
      return undefined;
    }
    return this.exercises[currentIndex - 1];
  }
}
