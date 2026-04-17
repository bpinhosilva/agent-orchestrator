import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ArgumentsHost } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockResponse: { status: jest.Mock; json: jest.Mock };
  let mockRequest: { url: string; method: string };
  let mockHost: ArgumentsHost;
  let loggerErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    filter = new HttpExceptionFilter();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockRequest = { url: '/api/v1/test', method: 'POST' };

    mockHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue(mockResponse),
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    } as unknown as ArgumentsHost;

    loggerErrorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => {});
  });

  afterEach(() => {
    loggerErrorSpy.mockRestore();
  });

  describe('HttpException handling', () => {
    it('should return 400 with string message', () => {
      filter.catch(
        new HttpException('Bad input', HttpStatus.BAD_REQUEST),
        mockHost,
      );
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400, message: 'Bad input' }),
      );
    });

    it('should return 404 with object response message', () => {
      filter.catch(
        new HttpException({ message: 'Not found' }, HttpStatus.NOT_FOUND),
        mockHost,
      );
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 404, message: 'Not found' }),
      );
    });

    it('should return 422 with errors array for validation failures', () => {
      filter.catch(
        new HttpException(
          { message: ['field is required'] },
          HttpStatus.UNPROCESSABLE_ENTITY,
        ),
        mockHost,
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Validation failed',
          errors: ['field is required'],
        }),
      );
    });

    it('should NOT log for HttpException', () => {
      filter.catch(
        new HttpException('Bad input', HttpStatus.BAD_REQUEST),
        mockHost,
      );
      expect(loggerErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe('non-HttpException handling', () => {
    it('should return 500 with generic message', () => {
      filter.catch(new Error('Unexpected failure'), mockHost);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 500,
          message: 'Internal server error',
        }),
      );
    });

    it('should log the error with stack trace', () => {
      const err = new Error('Unexpected failure');
      filter.catch(err, mockHost);
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unexpected failure'),
        err.stack,
      );
    });

    it('should log request method and path', () => {
      filter.catch(new Error('DB crashed'), mockHost);
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('POST'),
        expect.anything(),
      );
    });

    it('should handle non-Error exceptions gracefully', () => {
      filter.catch('string exception', mockHost);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(loggerErrorSpy).toHaveBeenCalled();
    });

    it('should include timestamp and path in the response', () => {
      filter.catch(new Error('boom'), mockHost);
      const calls = mockResponse.json.mock.calls as [Record<string, unknown>][];
      const payload = calls[0][0];
      expect(payload).toHaveProperty('timestamp');
      expect(payload).toHaveProperty('path', '/api/v1/test');
    });
  });
});
