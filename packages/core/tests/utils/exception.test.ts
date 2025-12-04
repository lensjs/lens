import { describe, it, expect, vi } from 'vitest';
import { constructErrorObject, cleanStack, getFileInfo, getStackTrace, extractCodeFrame } from '../../src/utils/exception';
import * as fs from 'node:fs';
import * as path from 'node:path';

// Mock fs.readFileSync and fs.existsSync for extractCodeFrame tests
vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    readFileSync: vi.fn(),
    existsSync: vi.fn(),
  };
});

describe('exception utils', () => {
  describe('constructErrorObject', () => {
    const mockFilePathForStack = path.resolve(process.cwd(), 'mock-stack-file.ts');
    const mockFileContentForStack = 'line 1\nline 2\nline 3 with error\nline 4\nline 5';

    beforeEach(() => {
      (fs.existsSync as vi.Mock).mockClear();
      (fs.readFileSync as vi.Mock).mockClear();
      (fs.existsSync as vi.Mock).mockReturnValue(true);
      (fs.readFileSync as vi.Mock).mockImplementation((filePath) => {
        if (filePath === mockFilePathForStack) {
          return mockFileContentForStack;
        }
        // Fallback for other files if needed, or throw if unexpected
        return '';
      });
    });

    it('should construct a basic error object with no stack', () => {
      const error = new Error('Test Error');
      error.stack = undefined; // Simulate no stack
      const exceptionEntry = constructErrorObject(error);

      expect(exceptionEntry.name).toBe('Error');
      expect(exceptionEntry.message).toBe('Test Error');
      expect(exceptionEntry.createdAt).toBeDefined();
      expect(exceptionEntry.fileInfo).toEqual({ file: '', function: '' });
      expect(exceptionEntry.cause).toBeNull();
      expect(exceptionEntry.trace).toEqual([]);
      expect(exceptionEntry.codeFrame).toBeNull();
      expect(exceptionEntry.originalStack).toBe('');
    });

    it('should construct an error object with a stack trace', () => {
      const error = new Error('Test Error');
      error.stack = `Error: Test Error\n    at Object.<anonymous> (${path.resolve(process.cwd(), mockFilePathForStack)}:3:10)`; // Controlled stack with absolute path
      const exceptionEntry = constructErrorObject(error);

      expect(exceptionEntry.name).toBe('Error');
      expect(exceptionEntry.message).toBe('Test Error');
      expect(exceptionEntry.createdAt).toBeDefined();
      expect(exceptionEntry.fileInfo.file).toBe(path.resolve(process.cwd(), mockFilePathForStack));
      expect(exceptionEntry.fileInfo.function).toBe('Object.<anonymous>'); // Function name parsed from stack
      expect(exceptionEntry.cause).toBeNull();
      expect(exceptionEntry.trace.length).toBeGreaterThan(0);
      expect(exceptionEntry.codeFrame).toBeDefined();
      expect(exceptionEntry.originalStack).toBeNull(); // Should be null if codeFrame is present
    });

    it('should handle errors with a custom name', () => {
      class CustomError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'CustomError';
        }
      }
      const error = new CustomError('Custom Error Message');
      const exceptionEntry = constructErrorObject(error);
      expect(exceptionEntry.name).toBe('CustomError');
      expect(exceptionEntry.message).toBe('Custom Error Message');
    });

    it('should handle errors with a cause property', () => {
      const causeError = new Error('Cause Error');
      const error = new Error('Main Error', { cause: causeError });
      const exceptionEntry = constructErrorObject(error);
      expect(exceptionEntry.cause).toEqual(causeError);
    });

    it('should return null for codeFrame if file does not exist', () => {
      const error = new Error('File Not Found Error');
      error.stack = 'Error: File Not Found Error\n    at Object.<anonymous> (/nonexistent/file.ts:10:1)';

      (fs.existsSync as vi.Mock).mockReturnValue(false);

      const exceptionEntry = constructErrorObject(error);
      expect(exceptionEntry.codeFrame).toBeNull();
      expect(exceptionEntry.originalStack).toBeDefined(); // Should have original stack if codeFrame is null
    });

    it('should return null for codeFrame if line number is invalid', () => {
      const error = new Error('Invalid Line Error');
      error.stack = 'Error: Invalid Line Error\n    at Object.<anonymous> (/some/file.ts:9999:1)';

      (fs.existsSync as vi.Mock).mockReturnValue(true);
      (fs.readFileSync as vi.Mock).mockReturnValue('line 1\nline 2');

      const exceptionEntry = constructErrorObject(error);
      expect(exceptionEntry.codeFrame).toBeNull();
      expect(exceptionEntry.originalStack).toBeDefined();
    });

    it('should extract code frame correctly', () => {
      const error = new Error('Code Frame Error');
      const mockFilePath = path.resolve(process.cwd(), 'mock-file.ts');
      error.stack = `Error: Code Frame Error\n    at Object.<anonymous> (${mockFilePath}:3:10)`;

      (fs.existsSync as vi.Mock).mockReturnValue(true);
      (fs.readFileSync as vi.Mock).mockReturnValue(
        'line 1\nline 2\nline 3 with error\nline 4\nline 5'
      );

      const exceptionEntry = constructErrorObject(error);
      expect(exceptionEntry.codeFrame).toBeDefined();
      expect(exceptionEntry.codeFrame?.file).toBe(mockFilePath);
      expect(exceptionEntry.codeFrame?.line).toBe(3);
      expect(exceptionEntry.codeFrame?.column).toBe(10);
      expect(exceptionEntry.codeFrame?.context.error).toBe('line 3 with error');
      expect(exceptionEntry.codeFrame?.context.pre).toEqual(['line 1', 'line 2']);
      expect(exceptionEntry.codeFrame?.context.post).toEqual(['line 4', 'line 5']);
    });
  });

  describe('cleanStack', () => {
    it('should clean a raw stack trace', () => {
      const rawStack = `Error: Test\n    at Object.<anonymous> (/path/to/file.ts:1:1)\n    at internal/main/run_main_module.js:17:47`;
      const cleanedStack = cleanStack(rawStack);
      expect(cleanedStack).not.toContain('internal/main/run_main_module.js');
      expect(cleanedStack).toContain('/path/to/file.ts');
    });

    it('should return empty string for undefined stack', () => {
      expect(cleanStack(undefined)).toBe('');
    });
  });

  describe('getFileInfo', () => {
    it('should extract file info from a stack trace', () => {
      const stack = `Error: Test\n    at myFunction (/path/to/file.ts:10:5)`;
      const fileInfo = getFileInfo(stack);
      expect(fileInfo).toEqual({ file: '/path/to/file.ts', line: 10, column: 5, function: 'myFunction' });
    });

    it('should return empty info for undefined stack', () => {
      expect(getFileInfo(undefined)).toEqual({ file: '', line: 0, column: 0, function: '' });
    });

    it('should handle stack with no file info', () => {
      const stack = `Error: Test\n    at <anonymous>`;
      const fileInfo = getFileInfo(stack);
      expect(fileInfo).toEqual({ file: '', line: 0, column: 0, function: '' });
    });
  });

  describe('getStackTrace', () => {
    it('should parse a stack trace into frames', () => {
      const stack = `Error: Test\n    at myFunction (/path/to/file.ts:10:5)\n    at anotherFunction (/path/to/another.ts:20:1)`;
      const trace = getStackTrace(stack);
      expect(trace).toEqual([
        'myFunction (/path/to/file.ts:10:5)',
        'anotherFunction (/path/to/another.ts:20:1)',
      ]);
    });

    it('should return empty array for undefined stack', () => {
      expect(getStackTrace(undefined)).toEqual([]);
    });
  });

  describe('extractCodeFrame', () => {
    const mockFilePath = path.resolve(process.cwd(), 'mock-file-for-codeframe.ts');
    const fileContent = [
      'line 1',
      'line 2',
      'line 3',
      'line 4 (error here)',
      'line 5',
      'line 6',
      'line 7',
      'line 8',
      'line 9',
      'line 10',
    ].join('\n');

    beforeEach(() => {
      (fs.existsSync as vi.Mock).mockReturnValue(true);
      (fs.readFileSync as vi.Mock).mockReturnValue(fileContent);
    });

    it('should extract code frame with default context lines', () => {
      const codeFrame = extractCodeFrame({ file: mockFilePath, line: 4, column: 10 });
      expect(codeFrame).toBeDefined();
      expect(codeFrame?.file).toBe(mockFilePath);
      expect(codeFrame?.line).toBe(4);
      expect(codeFrame?.column).toBe(10);
      expect(codeFrame?.context.error).toBe('line 4 (error here)');
      expect(codeFrame?.context.pre.length).toBe(3); // 3 lines before (line 1, 2, 3)
      expect(codeFrame?.context.post.length).toBe(6); // 6 lines after (line 5 to 10)
    });

    it('should handle start of file correctly', () => {
      const codeFrame = extractCodeFrame({ file: mockFilePath, line: 1, column: 1 });
      expect(codeFrame?.context.pre).toEqual([]);
      expect(codeFrame?.context.error).toBe('line 1');
      expect(codeFrame?.context.post.length).toBe(6); // Changed from 7 to 6
    });

    it('should handle end of file correctly', () => {
      const codeFrame = extractCodeFrame({ file: mockFilePath, line: 10, column: 1 });
      expect(codeFrame?.context.pre.length).toBe(6); // line 4 to 9
      expect(codeFrame?.context.error).toBe('line 10');
      expect(codeFrame?.context.post).toEqual([]);
    });

    it('should return null if file does not exist', () => {
      (fs.existsSync as vi.Mock).mockReturnValue(false);
      const codeFrame = extractCodeFrame({ file: '/nonexistent/file.ts', line: 1, column: 1 });
      expect(codeFrame).toBeNull();
    });

    it('should return null if line number is out of bounds (too low)', () => {
      const codeFrame = extractCodeFrame({ file: mockFilePath, line: 0, column: 1 });
      expect(codeFrame).toBeNull();
    });

    it('should return null if line number is out of bounds (too high)', () => {
      const codeFrame = extractCodeFrame({ file: mockFilePath, line: 100, column: 1 });
      expect(codeFrame).toBeNull();
    });

    it('should use custom contextLines', () => {
      const codeFrame = extractCodeFrame({ file: mockFilePath, line: 4, column: 10, contextLines: 1 });
      expect(codeFrame?.context.pre.length).toBe(1); // line 3
      expect(codeFrame?.context.post.length).toBe(1); // Changed from 2 to 1
    });
  });
});
