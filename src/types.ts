export interface Course {
  name: string;
  description: string;
  author: string;
  version: string;
  language: SupportedLanguage;
  exercises: ExerciseMetadata[];
}

export type SupportedLanguage = 'javascript' | 'python' | 'go' | 'rust';

export interface ExerciseMetadata {
  id: string;
  title: string;
  description: string;
  order: number;
  contextFiles?: string[];
  contextPatterns?: string[];
}

export interface Exercise extends ExerciseMetadata {
  path: string;
  exerciseFile: string;
  testFile: string;
  readmeFile: string;
}

export enum ExerciseStatus {
  Locked = 'locked',
  Available = 'available',
  InProgress = 'in-progress',
  Completed = 'completed'
}

export interface ExerciseProgress {
  exerciseId: string;
  completed: boolean;
  lastAttempt?: Date;
  completedAt?: Date;
}

export enum TestResult {
  Passed = 'passed',
  Failed = 'failed',
  Error = 'error'
}

export interface TestOutput {
  result: TestResult;
  output: string;
  exitCode: number;
}

export interface LanguageConfig {
  language: SupportedLanguage;
  testCommand: string[];
  testFilePattern: string;
  exerciseFileExtension: string;
  testFramework: string;
}

export const LANGUAGE_CONFIGS: Record<SupportedLanguage, LanguageConfig> = {
  javascript: {
    language: 'javascript',
    testCommand: ['npm', 'test', '--'],
    testFilePattern: '*.test.js',
    exerciseFileExtension: '.js',
    testFramework: 'jest'
  },
  python: {
    language: 'python',
    testCommand: ['pytest', '-v'],
    testFilePattern: 'test_*.py',
    exerciseFileExtension: '.py',
    testFramework: 'pytest'
  },
  go: {
    language: 'go',
    testCommand: ['go', 'test', '-v'],
    testFilePattern: '*_test.go',
    exerciseFileExtension: '.go',
    testFramework: 'go test'
  },
  rust: {
    language: 'rust',
    testCommand: ['cargo', 'test', '--'],
    testFilePattern: '*.rs',
    exerciseFileExtension: '.rs',
    testFramework: 'cargo test'
  }
};
