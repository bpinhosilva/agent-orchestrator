import { mkdtemp, readFile, rm } from 'fs/promises';
import * as path from 'path';
import type { OpenApiToPostmanConverter } from './postman-conversion';
import {
  convertOpenApiToPostman,
  writePostmanCollection,
} from './postman-conversion';

describe('postman-conversion', () => {
  describe('convertOpenApiToPostman', () => {
    it('returns converted collection data when the adapter reports success', async () => {
      const converter: OpenApiToPostmanConverter = (
        input,
        options,
        callback,
      ) => {
        callback(null, {
          result: true,
          output: [{ data: { info: { name: 'Agent Orchestrator API' } } }],
        });
      };

      await expect(
        convertOpenApiToPostman('{"openapi":"3.0.0"}', converter),
      ).resolves.toEqual({ info: { name: 'Agent Orchestrator API' } });
    });

    it('throws the converter reason when conversion fails', async () => {
      const converter: OpenApiToPostmanConverter = (
        input,
        options,
        callback,
      ) => {
        callback(null, {
          result: false,
          reason: 'bad schema',
        });
      };

      await expect(
        convertOpenApiToPostman('{"openapi":"3.0.0"}', converter),
      ).rejects.toThrow('bad schema');
    });

    it('rejects the callback error when the adapter errors', async () => {
      const error = new Error('adapter exploded');
      const converter: OpenApiToPostmanConverter = (
        input,
        options,
        callback,
      ) => {
        callback(error, {
          result: false,
          reason: 'ignored',
        });
      };

      await expect(
        convertOpenApiToPostman('{"openapi":"3.0.0"}', converter),
      ).rejects.toThrow(error);
    });
  });

  describe('writePostmanCollection', () => {
    it('writes the collection JSON to disk', async () => {
      const tmpDir = await mkdtemp(path.join(process.cwd(), '.postman-test-'));
      const outputPath = path.join(tmpDir, 'collection.json');

      try {
        writePostmanCollection(outputPath, {
          info: { name: 'Agent Orchestrator API' },
          item: [],
        });

        expect(JSON.parse(await readFile(outputPath, 'utf8'))).toEqual({
          info: { name: 'Agent Orchestrator API' },
          item: [],
        });
      } finally {
        await rm(tmpDir, { recursive: true, force: true });
      }
    });
  });
});
