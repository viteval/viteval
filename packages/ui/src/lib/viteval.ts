import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { EvalResults, ResultFile } from '../types';

class VitevalFileReader {
  /**
   * List all result files with their metadata
   * @returns Array of ResultFile objects, sorted by timestamp descending (newest first)
   */
  public async list(): Promise<ResultFile[]> {
    try {
      this.validateResultsDirectory();
      const resultsDir = this.getResultsDirectory();

      const fileResult = await Promise.all(
        (await fs.readdir(resultsDir))
          .filter((file) => file.endsWith('.json'))
          .map(async (fileName) => {
            const filePath = path.join(resultsDir, fileName);
            return this.parseResultFile(filePath, fileName);
          })
      );

      const files = fileResult
        .filter((file): file is ResultFile => file !== null)
        .sort(
          (a, b) => Number.parseInt(b.timestamp) - Number.parseInt(a.timestamp)
        );
      return files;
    } catch (_error) {
      return [];
    }
  }

  /**
   * Read a specific result file by ID (filename without .json extension)
   * @param id - The result ID (timestamp)
   * @returns The parsed result data or null if not found
   */
  public async read(id: string): Promise<EvalResults | null> {
    try {
      this.validateResultsDirectory();
      const resultsDir = this.getResultsDirectory();
      const fileName = `${id}.json`;
      const filePath = path.join(resultsDir, fileName);

      // Security: ensure the constructed path is still within the results directory
      const normalizedPath = path.normalize(filePath);
      if (!normalizedPath.startsWith(resultsDir)) {
        throw new Error('Access denied: invalid file path');
      }

      if (!(await exists(normalizedPath))) {
        return null;
      }

      const fileContent = await fs.readFile(normalizedPath, 'utf8');
      const data = JSON.parse(fileContent) as EvalResults;
      return data;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('Invalid JSON file');
      }
      throw error;
    }
  }

  private getResultsDirectory(): string {
    const vitevalRootPath = process.env.VITEVAL_ROOT_PATH;

    if (!vitevalRootPath) {
      throw new Error('VITEVAL_ROOT_PATH environment variable not set');
    }

    return path.join(vitevalRootPath, '.viteval', 'results');
  }

  private async validateResultsDirectory(): Promise<void> {
    const resultsDir = this.getResultsDirectory();

    if (!(await exists(resultsDir))) {
      throw new Error(`Results directory not found: ${resultsDir}`);
    }
  }

  private async parseResultFile(
    filePath: string,
    fileName: string
  ): Promise<ResultFile | null> {
    try {
      const fileContent = await fs.readFile(filePath, 'utf8');
      const results: EvalResults = JSON.parse(fileContent);
      const stats = await fs.stat(filePath);
      const id = fileName.replace('.json', '');

      return {
        id,
        name: fileName,
        path: filePath,
        timestamp: id,
        size: stats.size,
        summary: {
          success: results.success,
          numTotalEvalSuites: results.numTotalEvalSuites,
          numPassedEvalSuites: results.numPassedEvalSuites,
          numFailedEvalSuites: results.numFailedEvalSuites,
          numTotalEvals: results.numTotalEvals,
          numPassedEvals: results.numPassedEvals,
          numFailedEvals: results.numFailedEvals,
          duration: results.duration,
          startTime: results.startTime,
          endTime: results.endTime,
        },
      };
    } catch (_error) {
      return null;
    }
  }
}

export const vitevalReader = new VitevalFileReader();

/*
|------------------
| Internals
|------------------
*/

async function exists(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}
