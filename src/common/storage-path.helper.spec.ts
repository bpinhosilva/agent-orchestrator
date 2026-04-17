import { StoragePathHelper, StorageContext } from './storage-path.helper';

describe('StoragePathHelper', () => {
  let helper: StoragePathHelper;

  beforeEach(() => {
    helper = new StoragePathHelper();
  });

  // ---------------------------------------------------------------------------
  // StorageContext enum
  // ---------------------------------------------------------------------------

  describe('StorageContext enum', () => {
    it('should expose lowercase string values', () => {
      expect(StorageContext.TASKS).toBe('tasks');
      expect(StorageContext.AGENTS).toBe('agents');
      expect(StorageContext.COMMENTS).toBe('comments');
    });
  });

  // ---------------------------------------------------------------------------
  // generate()
  // ---------------------------------------------------------------------------

  describe('generate', () => {
    const baseOptions = {
      context: StorageContext.TASKS,
      contextId: 'task-abc-123',
      mimeType: 'image/png',
      originalName: 'photo.png',
    };

    it('should return an object with id, filePath, originalName, mimeType', () => {
      const result = helper.generate(baseOptions);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('filePath');
      expect(result.originalName).toBe('photo.png');
      expect(result.mimeType).toBe('image/png');
    });

    it('should generate a valid UUID for id', () => {
      const result = helper.generate(baseOptions);

      expect(result.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
    });

    it('should produce unique IDs on consecutive calls', () => {
      const a = helper.generate(baseOptions);
      const b = helper.generate(baseOptions);

      expect(a.id).not.toBe(b.id);
      expect(a.filePath).not.toBe(b.filePath);
    });

    it('should embed the date (YYYY/MM/DD) at the start of filePath', () => {
      const result = helper.generate(baseOptions);
      const today = new Date();
      const year = today.getFullYear().toString();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');

      expect(result.filePath.startsWith(`${year}/${month}/${day}/`)).toBe(true);
    });

    it('should embed the lowercase context name in the path', () => {
      const result = helper.generate(baseOptions);

      expect(result.filePath).toContain('/tasks/');
    });

    it('should embed the contextId in the path', () => {
      const result = helper.generate(baseOptions);

      expect(result.filePath).toContain('/task-abc-123/');
    });

    it('should use the id as the filename stem', () => {
      const result = helper.generate(baseOptions);

      expect(result.filePath).toContain(`/${result.id}.`);
    });

    it('should use posix separators (forward slashes) in filePath', () => {
      const result = helper.generate(baseOptions);

      expect(result.filePath).not.toContain('\\');
    });

    // -------------------------------------------------------------------------
    // MIME → extension mapping
    // -------------------------------------------------------------------------

    it.each([
      ['image/png', 'png'],
      ['image/jpeg', 'jpg'],
      ['image/gif', 'gif'],
      ['image/webp', 'webp'],
      ['image/svg+xml', 'svg'],
      ['application/pdf', 'pdf'],
      ['text/plain', 'txt'],
      ['text/csv', 'csv'],
      ['text/markdown', 'md'],
      ['application/json', 'json'],
    ])('should map %s to .%s extension', (mimeType, ext) => {
      const result = helper.generate({ ...baseOptions, mimeType });

      expect(result.filePath).toMatch(new RegExp(`\\.${ext}$`));
    });

    it('should reject an unknown MIME type', () => {
      expect(() =>
        helper.generate({ ...baseOptions, mimeType: 'application/exe' }),
      ).toThrow();
    });

    // -------------------------------------------------------------------------
    // Context normalisation
    // -------------------------------------------------------------------------

    it('should produce lowercase path segments regardless of enum casing', () => {
      // Even if someone passes a raw string with extra whitespace (future-proofing),
      // the helper must sanitise it
      const result = helper.generate({
        ...baseOptions,
        context: '  Tasks  ' as unknown as StorageContext,
      });

      expect(result.filePath).toContain('/tasks/');
      expect(result.filePath).not.toContain(' ');
    });

    // -------------------------------------------------------------------------
    // All contexts produce valid paths
    // -------------------------------------------------------------------------

    it.each(Object.values(StorageContext))(
      'should generate a valid path for context %s',
      (context) => {
        const result = helper.generate({ ...baseOptions, context });

        expect(result.filePath).toMatch(
          /^\d{4}\/\d{2}\/\d{2}\/.+\/.+\/.+\.\w+$/,
        );
      },
    );
  });
});
