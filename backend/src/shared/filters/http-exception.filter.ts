import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiResponseDto } from '../dto/api-response.dto';

interface HttpExceptionResponse {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);
  private readonly isProduction = process.env.NODE_ENV === 'production';

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorDetails: string | null = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (this.isHttpExceptionResponse(exceptionResponse)) {
        // Handle array of messages (validation errors)
        if (Array.isArray(exceptionResponse.message)) {
          message = exceptionResponse.message.join(', ');
        } else if (exceptionResponse.message) {
          message = exceptionResponse.message;
        }
        errorDetails = exceptionResponse.error || null;
      }
    } else if (exception instanceof Error) {
      // Unexpected errors (e.g. "Failed query: <SQL>") would leak internals; hide them in production
      message = this.isProduction ? 'Internal server error' : exception.message;
      // Only expose stack trace in development
      errorDetails = this.isProduction ? null : exception.stack || null;
    }

    // Drizzle wraps the real database error in `cause` (e.g. pooler or connection errors)
    const cause = exception instanceof Error ? (exception as Error & { cause?: unknown }).cause : undefined;
    const causeText = cause instanceof Error ? ` | cause: ${cause.message}` : '';
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${exception instanceof Error ? exception.message : message}${causeText}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json(ApiResponseDto.error(message, errorDetails));
  }

  private isHttpExceptionResponse(response: unknown): response is HttpExceptionResponse {
    return typeof response === 'object' && response !== null;
  }
}
