import * as fs from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import * as path from 'node:path';
import type {
  DatasetFile,
  DatasetSummary,
  EvalResults,
  EvalSchema,
  ResultFile,
  SuiteSummary,
} from '../types';

class VitevalFileReader {
  private readonly rootPath: string;

  constructor(rootPath?: string) {
    this.rootPath = rootPath || process.env.VITEVAL_ROOT_PATH || process.cwd();
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

  public async listSuites(): Promise<SuiteSummary[]> {
    const results = await this.listResults();
    const suiteMap = new Map<string, SuiteSummary>();

    for (const result of results) {
      const full = await this.readResult(result.timestamp);
      if (!full?.evalResults) continue;

      for (const suite of full.evalResults) {
        const existing = suiteMap.get(suite.name);
        if (existing) {
          existing.runCount++;
          // results are sorted newest-first, so first seen is latest
        } else {
          suiteMap.set(suite.name, {
            name: suite.name,
            filepath: suite.filepath,
            runCount: 1,
            latestStatus: suite.status,
            latestRunTimestamp: result.timestamp,
            latestDuration: suite.duration,
            latestMeanScore: suite.summary.meanScore,
            latestPassedCount: suite.summary.passedCount,
            latestTotalCount: suite.summary.totalCount,
          });
        }
      }
    }

    return [...suiteMap.values()].toSorted((a, b) =>
      a.name.localeCompare(b.name)
    );
  }

  public async listDatasets(): Promise<DatasetSummary[]> {
    const fileIds = await this.list('datasets', (a, b) => a.localeCompare(b));

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

  public async listSchemas(): Promise<EvalSchema[]> {
    try {
      const patterns = ['src/**/*.eval.ts', 'src/**/*.eval.js'];
      const schemas: EvalSchema[] = [];

      for (const pattern of patterns) {
        const matches = glob(pattern, { cwd: this.rootPath });
        for await (const match of matches) {
          const filePath = path.join(this.rootPath, match);
          const content = await fs.readFile(filePath, 'utf8');
          const relativePath = path.relative(this.rootPath, filePath);
          schemas.push({
            id: relativePath,
            name: path.basename(relativePath),
            path: relativePath,
            content,
          });
        }
      }

      return schemas.toSorted((a, b) => a.name.localeCompare(b.name));
    } catch {
      return [];
    }
  }

  public async readSchema(id: string): Promise<EvalSchema | null> {
    try {
      const filePath = path.join(this.rootPath, id);
      const normalizedPath = path.normalize(filePath);
      if (!normalizedPath.startsWith(this.rootPath)) {
        return null;
      }
      if (!(await exists(normalizedPath))) {
        return null;
      }
      const content = await fs.readFile(normalizedPath, 'utf8');
      return {
        id,
        name: path.basename(id),
        path: id,
        content,
      };
    } catch {
      return null;
    }
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
        .toSorted(sortFn);

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

      const suiteNames = results.evalResults?.map((s) => s.name) ?? [];

      return {
        id,
        name: fileName,
        path: filePath,
        size: stats.size,
        summary: {
          duration: results.duration,
          endTime: results.endTime,
          numFailedEvalSuites: results.numFailedEvalSuites,
          numFailedEvals: results.numFailedEvals,
          numPassedEvalSuites: results.numPassedEvalSuites,
          numPassedEvals: results.numPassedEvals,
          numTotalEvalSuites: results.numTotalEvalSuites,
          numTotalEvals: results.numTotalEvals,
          startTime: results.startTime,
          status: results.status,
          success: results.success,
          suiteNames,
        },
        timestamp: id,
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
        createdAt: data.createdAt,
        description: data.description,
        id,
        itemCount: data.data ? data.data.length : 0,
        name: data.name || id,
        path: path.relative(this.rootPath, filePath),
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
