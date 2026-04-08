import {
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

function includeErrorStack(): boolean {
  return (
    process.env.API_VERBOSE_ERRORS === '1' ||
    process.env.NODE_ENV === 'development' ||
    process.env.NODE_ENV === 'test' ||
    !process.env.NODE_ENV
  );
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      const payload =
        typeof body === 'object' && body !== null
          ? (body as Record<string, unknown>)
          : { message: body };
      response.status(status).json({
        success: false,
        statusCode: status,
        ...payload,
      });
      return;
    }

    const message =
      exception instanceof Error
        ? exception.message
        : typeof exception === 'string'
          ? exception
          : (() => {
              try {
                return JSON.stringify(exception);
              } catch {
                return 'Erro não serializável';
              }
            })();

    const payload: Record<string, unknown> = {
      message,
      error: exception instanceof Error ? exception.name : typeof exception,
    };

    if (includeErrorStack() && exception instanceof Error && exception.stack) {
      payload.stack = exception.stack;
    }

    this.logger.error(message, exception instanceof Error ? exception.stack : String(exception));

    response.status(status).json({
      success: false,
      statusCode: status,
      ...payload,
    });
  }
}
