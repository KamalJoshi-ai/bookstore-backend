import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

const logger = winston.createLogger({
  level: "info",

  format: winston.format.combine(
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),

    winston.format.errors({
      stack: true,
    }),

    winston.format.json()
  ),

  transports: [

    new winston.transports.Console(),
    new DailyRotateFile({
      dirname: "logs/combined",

      filename: "combined-%DATE%.log",

      datePattern: "YYYY-MM-DD",

      maxSize: "10m",

      maxFiles: "14d",
    }),

    // ERROR LOGS ONLY
    new DailyRotateFile({
      level: "error",

      dirname: "logs/error",

      filename: "error-%DATE%.log",

      datePattern: "YYYY-MM-DD",

      maxSize: "10m",

      maxFiles: "30d",
    }),
  ],
});

export default logger;