import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type {
  DatasetFile,
  DatasetSummary,
  EvalResults,
  ResultFile,
} from '../types';

interface ListOptions {
  next?: string;
  limit?: number;
}

class VitevalFileReader {
  private readonly rootPath: string;

  constructor(rootPath?: string) {
    this.rootPath = rootPath || process.env.VITEVAL_ROOT_PATH || process.cwd();
  }

  /**
   * List result files with pagination
   * @param options - Pagination options
   * @returns Object with results array and next cursor
   */
  public async listResults(
    options: ListOptions = {}
  ): Promise<{ results: ResultFile[]; next?: string }> {
    const fileIds = await this.list(
      'results',
      options,
      (a, b) => Number.parseInt(b, 10) - Number.parseInt(a, 10)
    );

    const results = await Promise.all(
      fileIds.results.map(async (id) => {
        const filePath = path.join(
          this.getVitevalDirectory(),
          'results',
          `${id}.json`
        );
        return this.parseResultFile(filePath, `${id}.json`);
      })
    );

    return {
      results: results.filter((file): file is ResultFile => file !== null),
      next: fileIds.next,
    };
  }

  /**
   * Read a specific result file by ID (filename without .json extension)
   * @param id - The result ID (timestamp)
   * @returns The parsed result data or null if not found
   */
  public async readResult(id: string): Promise<EvalResults | null> {
    const content = await this.read(`results/${id}.json`);
    return content ? JSON.parse(content) : null;
  }

  /**
   * List datasets with pagination
   * @param options - Pagination options
   * @returns Object with results array and next cursor
   */
  public async listDatasets(
    options: ListOptions = {}
  ): Promise<{ results: DatasetSummary[]; next?: string }> {
    const fileIds = await this.list('datasets', options, (a, b) =>
      a.localeCompare(b)
    );

    const results = await Promise.all(
      fileIds.results.map(async (id) => {
        const filePath = path.join(
          this.getVitevalDirectory(),
          'datasets',
          `${id}.json`
        );
        return this.parseDatasetSummaryFile(filePath, `${id}.json`);
      })
    );

    return {
      results: results.filter(
        (dataset): dataset is DatasetSummary => dataset !== null
      ),
      next: fileIds.next,
    };
  }

  /**
   * Read a specific dataset by ID
   * @param id - The dataset ID (directory name)
   * @returns The parsed dataset data or null if not found
   */
  public async readDataset(id: string): Promise<DatasetFile | null> {
    const content = await this.read(`datasets/${id}.json`);
    const d = content ? JSON.parse(content) : null;

    if (!d) {
      return null;
    }

    return {
      ...d,
      path: path.relative(
        this.rootPath,
        path.join(this.getVitevalDirectory(), 'datasets', `${id}.json`)
      ),
      storage: 'local',
    };
  }

  private async list(
    dirPath: string,
    options: ListOptions,
    sortFn: (a: string, b: string) => number
  ): Promise<{ results: string[]; next?: string }> {
    try {
      const { next, limit = 10 } = options;
      const fullPath = path.join(this.getVitevalDirectory(), dirPath);

      if (!(await exists(fullPath))) {
        return { results: [] };
      }

      const fileIds = (await fs.readdir(fullPath))
        .filter((file) => file.endsWith('.json'))
        .map((file) => file.replace('.json', ''))
        .sort(sortFn);

      // Find starting index after the provided ID
      let startIndex = 0;
      if (next) {
        const afterIndex = fileIds.indexOf(next);
        if (afterIndex !== -1) {
          startIndex = afterIndex + 1;
        }
      }

      // Slice the results for pagination
      const paginatedResults = fileIds.slice(startIndex, startIndex + limit);

      // Determine next cursor
      const lastItem = fileIds[fileIds.length - 1];
      const nextItem =
        startIndex + limit < fileIds.length
          ? paginatedResults[paginatedResults.length - 1]
          : undefined;

      return {
        results: paginatedResults,
        next: lastItem !== nextItem ? nextItem : undefined,
      };
    } catch (_error) {
      return { results: [] };
    }
  }

  private async read(filePath: string): Promise<string | null> {
    try {
      const fullPath = path.join(this.getVitevalDirectory(), filePath);
      const vitevalDir = this.getVitevalDirectory();

      // Security: ensure the constructed path is still within the viteval directory
      const normalizedPath = path.normalize(fullPath);
      if (!normalizedPath.startsWith(vitevalDir)) {
        throw new Error('Access denied: invalid file path');
      }

      if (!(await exists(normalizedPath))) {
        return null;
      }

      return await fs.readFile(normalizedPath, 'utf8');
    } catch (_error) {
      return null;
    }
  }

  private getVitevalDirectory(): string {
    return path.join(this.rootPath, '.viteval');
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
          status: results.status,
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

  private async parseDatasetSummaryFile(
    filePath: string,
    fileName: string
  ): Promise<DatasetSummary | null> {
    try {
      const fileContent = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(fileContent);
      const id = fileName.replace('.json', '');

      return {
        id,
        name: data.name || id,
        description: data.description,
        path: path.relative(this.rootPath, filePath),
        itemCount: data.data ? data.data.length : 0,
        createdAt: data.createdAt,
        storage: data.storage || 'local',
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
