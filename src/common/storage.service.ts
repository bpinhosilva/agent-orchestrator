/**
 * Abstract storage service used as the NestJS DI token.
 * Implementations handle different storage backends (filesystem, S3, …).
 *
 * **Path ownership model**: callers are responsible for generating the
 * `filePath` (via {@link StoragePathHelper}) before calling `save` or
 * `saveBase64`.  The storage service only persists bytes; it does not produce
 * filenames or directory structures.
 */
export abstract class StorageService {
  /**
   * Persist `buffer` at the given `filePath` inside `bucket`.
   *
   * @param buffer   Raw bytes to write.
   * @param mimeType MIME type used for validation (e.g. `"image/png"`).
   * @param filePath Bucket-relative posix path produced by
   *                 {@link StoragePathHelper.generate} (e.g.
   *                 `"2024/01/15/tasks/task-id/uuid.png"`).
   * @param bucket   Storage bucket / top-level folder (defaults to
   *                 implementation-specific default).
   */
  abstract save(
    buffer: Buffer,
    mimeType: string,
    filePath: string,
    bucket?: string,
  ): Promise<void>;

  /**
   * Decode a base64 string and delegate to {@link save}.
   *
   * @param base64   Base64-encoded content.
   * @param mimeType MIME type used for validation.
   * @param filePath Bucket-relative posix path (see {@link save}).
   * @param bucket   Storage bucket / top-level folder.
   */
  abstract saveBase64(
    base64: string,
    mimeType: string,
    filePath: string,
    bucket?: string,
  ): Promise<void>;

  /**
   * Delete the file at `relativePath` inside `bucket`.
   * `relativePath` is the value previously supplied to (or returned from) save.
   */
  abstract delete(relativePath: string, bucket?: string): Promise<void>;

  /**
   * Resolve `relativePath` (relative to `bucket`) to the backend-specific
   * full address (filesystem path for FS, pre-signed URL for S3, …).
   */
  abstract getFullPath(relativePath: string, bucket?: string): string;

  /**
   * Return the backend-specific root address for `bucket`
   * (absolute directory for FS, bucket URL for S3, …).
   */
  abstract getBucketPath(bucket: string): string;
}
