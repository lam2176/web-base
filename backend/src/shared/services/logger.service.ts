import { Injectable } from '@nestjs/common';
import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';
import { join } from 'path';

@Injectable()
export class LoggerService {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.printf(({ timestamp, level, message, stack }) => {
          if (stack) {
            return `${timestamp} [${level.toUpperCase()}]: ${message}\n${stack}`;
          }
          return `${timestamp} [${level.toUpperCase()}]: ${message}`;
        }),
      ),
      transports: [
        // Console transport
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, stack }) => {
              if (stack) {
                return `${timestamp} ${level}: ${message}\n${stack}`;
              }
              return `${timestamp} ${level}: ${message}`;
            }),
          ),
        }),
        // Daily rotate file transport
        new DailyRotateFile({
          dirname: join(process.cwd(), 'logs'),
          filename: 'app-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
          format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.printf(({ timestamp, level, message, stack }) => {
              if (stack) {
                return `${timestamp} [${level.toUpperCase()}]: ${message}\n${stack}`;
              }
              return `${timestamp} [${level.toUpperCase()}]: ${message}`;
            }),
          ),
        }),
        // Error logs in separate file
        new DailyRotateFile({
          level: 'error',
          dirname: join(process.cwd(), 'logs'),
          filename: 'error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '30d',
        }),
      ],
    });
  }

  log(message: string, context?: string): void {
    const logMessage = context ? `[${context}] ${message}` : message;
    this.logger.info(logMessage);
  }

  error(message: string, trace?: string, context?: string): void {
    const logMessage = context ? `[${context}] ${message}` : message;
    if (trace) {
      this.logger.error(logMessage, { stack: trace });
    } else {
      this.logger.error(logMessage);
    }
  }

  warn(message: string, context?: string): void {
    const logMessage = context ? `[${context}] ${message}` : message;
    this.logger.warn(logMessage);
  }

  debug(message: string, context?: string): void {
    const logMessage = context ? `[${context}] ${message}` : message;
    this.logger.debug(logMessage);
  }

  verbose(message: string, context?: string): void {
    const logMessage = context ? `[${context}] ${message}` : message;
    this.logger.verbose(logMessage);
  }
}
