import pino from "pino";
import { env, isProduction } from "../config/env";

export const logger = pino({
  level: env.LOG_LEVEL,

  base: isProduction
    ? { pid: process.pid, hostname: process.env.HOSTNAME ?? "api" }
    : { pid: process.pid },

  timestamp: pino.stdTimeFunctions.isoTime,

  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "res.headers['set-cookie']",
      "*.password",
      "*.token",
      "*.refreshToken",
      "*.accessToken",
    ],
    censor: "[REDACTED]",
  },

  ...(isProduction
    ? {}
    : {
        transport: {
          target:  "pino-pretty",
          options: {
            colorize:          true,
            translateTime:     "SYS:HH:MM:ss.l",
            ignore:            "pid,hostname",
            messageFormat:     "{msg}",
            singleLine:        false,
          },
        },
      }),
});
