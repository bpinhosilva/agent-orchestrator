import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let errors: string[] = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const resObj = exceptionResponse as Record<string, unknown>;
        message =
          typeof resObj.message === 'string' ? resObj.message : 'Http Error';
        if (Array.isArray(resObj.message)) {
          errors = resObj.message as string[];
          message = 'Validation failed';
        }
      }
    } else {
      const err =
        exception instanceof Error ? exception : new Error(String(exception));
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}: ${err.message}`,
        err.stack,
      );
    }

    response.status(status).json({
      statusCode: status,
      message,
      ...(errors.length > 0 ? { errors } : {}),
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
