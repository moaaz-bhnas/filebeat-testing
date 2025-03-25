import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerModule } from 'nestjs-pino';
import pino from 'pino';
import { createStream } from 'rotating-file-stream';
import * as _ from 'lodash';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        formatters: {
          level: (label, number) => {
            return {
              level: label,
            };
          },
        },
        // stream:
        //   process.env.NODE_ENV == 'dev' || process.env.LOG_TO_FILE == 'true'
        //     ? pino.destination({ dest: './logs.log' })
        //     : pino.destination(),
        stream: pino.multistream([
          // Keep logging to Datadog. Should be removed once migration to Elk is complete
          { stream: process.stdout },
          {
            stream: createStream('logs.log', {
              path: './logs',
              size: '10M', // Rotate when file reaches 10MB
              interval: '1d', // Rotate daily
              compress: false, // Compress old logs
              maxFiles: 7, // Keep the last 7 log files
            }),
          },
        ]),

        customSuccessMessage: function (req, res) {
          return `<- ${res.statusCode} ${req.method} ${req.url}`;
        },

        customReceivedMessage: function (req, res) {
          return `-> ${req.method} ${req.url}`;
        },
        // Define a custom error message
        customErrorMessage: function (req, res, err) {
          return `<- ${res.statusCode} ${req.method} ${req.url}`;
        },

        serializers: {
          req: (req) => {
            const sensitiveKeys = [
              /password/i,
              /authorization/i,
              /signature/i,
              /api_key/i,
              /token/i,
              /secret/i,
            ];

            function sanitize(data: any) {
              let result = _.isArray(data) ? [] : {};

              if (!_.isObject(data) && !_.isArray(data)) return data;

              for (const key in data) {
                if (sensitiveKeys.some((regex) => regex.test(key))) {
                  result[key] = '***';
                } else {
                  result = Object.assign(result, {
                    [key]: sanitize(data[key]),
                  });
                }
              }

              return result;
            }

            req.body = sanitize(req.raw.body);
            req.headers = sanitize(req.headers);
            return req;
          },
        },

        // Define a custom logger level
        customLogLevel: function (req, res, err) {
          if (res.statusCode >= 400 && res.statusCode < 500) {
            return 'warn';
          } else if (res.statusCode >= 500 || err) {
            return 'error';
          } /*else if (res.statusCode >= 300 && res.statusCode < 400) {
          return 'silent';
        }*/
          return 'info';
        },
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
