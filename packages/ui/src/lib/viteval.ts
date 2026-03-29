import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type {
  DatasetFile,
  DatasetSummary,
  EvalResults,
  ResultFile,
} from '../types';

class VitevalFileReader {
  private readonly rootPath: string;

  constructor(rootPath?: string) {
    this.rootPath =
      rootPath || process.env.VITEVAL_ROOT_PATH || process.cwd();
  }

  public async listResults(): Promise<ResultFile[]> {
    const fileIds = await this.list(
      'results',
      (a, b) => Number.parseInt(b, 10) - Number.parseInt(a, 10)
    );

    const results = await Promise.all(
      fileIds.map(async (id) => {
        const filePath = path.join(
          this.getVitevalDirectory(),
          'results',
          `${id}.json`
        );
        return this.parseResultFile(filePath, `${id}.json`);
      })
    );

    return results.filter((file): file is ResultFile => file !== null);
  }

  public async readResult(id: string): Promise<EvalResults | null> {
    const content = await this.read(`results/${id}.json`);
    return content ? JSON.parse(content) : null;
  }

  public async listDatasets(): Promise<DatasetSummary[]> {
    const fileIds = await this.list(
      'datasets',
      (a, b) => a.localeCompare(b)
    );

    const results = await Promise.all(
      fileIds.map(async (id) => {
        const filePath = path.join(
          this.getVitevalDirectory(),
          'datasets',
          `${id}.json`
        );
        return this.parseDatasetSummaryFile(filePath, `${id}.json`);
      })
    );

    return results.filter(
      (dataset): dataset is DatasetSummary => dataset !== null
    );
  }

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
    sortFn: (a: string, b: string) => number
  ): Promise<string[]> {
    try {
      const fullPath = path.join(this.getVitevalDirectory(), dirPath);

      if (!(await exists(fullPath))) {
        return [];
      }

      const fileIds = (await fs.readdir(fullPath))
        .filter((file) => file.endsWith('.json'))
        .map((file) => file.replace('.json', ''))
        .sort(sortFn);

      return fileIds;
    } catch {
      return [];
    }
  }

  private async read(filePath: string): Promise<string | null> {
    try {
      const fullPath = path.join(this.getVitevalDirectory(), filePath);
      const vitevalDir = this.getVitevalDirectory();

      const normalizedPath = path.normalize(fullPath);
      if (!normalizedPath.startsWith(vitevalDir)) {
        throw new Error('Access denied: invalid file path');
      }

      if (!(await exists(normalizedPath))) {
        return null;
      }

      return await fs.readFile(normalizedPath, 'utf8');
    } catch {
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
    } catch {
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
    } catch {
      return null;
    }
  }
}

export const vitevalReader = new VitevalFileReader();

async function exists(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}
