import * as fs from 'fs';

type ConverterCallback = (
  error: unknown,
  result: PostmanConversionResult,
) => void;

export type OpenApiToPostmanConverter = (
  input: { type: 'string'; data: string },
  options: { schemaFaker: true },
  callback: ConverterCallback,
) => void;

type PostmanConversionResult = {
  result: boolean;
  reason?: string;
  output?: Array<{ data: Record<string, unknown> }>;
};

export function convertOpenApiToPostman(
  openApiJson: string,
  convert: OpenApiToPostmanConverter,
): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    convert(
      { type: 'string', data: openApiJson },
      { schemaFaker: true },
      (error, result) => {
        if (error) {
          reject(
            error instanceof Error ? error : new Error('Converter failed'),
          );
          return;
        }

        if (!result?.result) {
          reject(
            new Error(
              result?.reason ??
                'Could not convert OpenAPI document to Postman collection',
            ),
          );
          return;
        }

        resolve(result.output?.[0]?.data ?? {});
      },
    );
  });
}

export function writePostmanCollection(
  outputPath: string,
  collection: Record<string, unknown>,
): void {
  fs.writeFileSync(outputPath, JSON.stringify(collection, null, 2));
}
