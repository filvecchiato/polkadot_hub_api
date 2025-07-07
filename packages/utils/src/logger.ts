import winston, { transports, format, Logger } from "winston"
import { LogLevel } from "@polkadot-hub-api/types"
import { ConfigRegistry } from "./config"

const customFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.printf((info) => {
    if (info.level === LogLevel.NONE) {
      return "" // Don't output anything for 'none' level
    }
    // Check if info.message is an object and stringify it for better readability
    const message =
      typeof info.message === "object"
        ? JSON.stringify(info.message, null, 2)
        : info.message
    // Handle additional arguments gracefully, ensuring they are also stringified if objects
    const splatData = info[Symbol.for("splat")]
    const args = Array.isArray(splatData)
      ? splatData.map((arg) =>
          typeof arg === "object" ? JSON.stringify(arg, null, 2) : arg,
        )
      : []
    return `${info.timestamp} [${info.level.toUpperCase()}] [${info.label}] ${message} ${args.join(" ")}`
  }),
)

let defaultLogLevel: LogLevel = LogLevel.INFO
const definedLoggers: [string, LogLevel][] = []
if (ConfigRegistry.logConfig) {
  // Set global default level if defined in config
  const logConfig = ConfigRegistry.logConfig
  if (logConfig.defaultLogLevel) {
    defaultLogLevel = logConfig.defaultLogLevel
  }
  // Configure specific loggers
  if (logConfig.loggers && typeof logConfig.loggers === "object") {
    for (const loggerName in logConfig.loggers) {
      const level = logConfig.loggers[loggerName]
      if (logConfig.loggers[loggerName]) {
        definedLoggers.push([loggerName, level])
      }
    }
  }
}

const winstonLevels = {
  [LogLevel.ERROR]: 0,
  [LogLevel.WARN]: 1,
  [LogLevel.INFO]: 2,
  [LogLevel.HTTP]: 3,
  [LogLevel.VERBOSE]: 4,
  [LogLevel.DEBUG]: 5,
  [LogLevel.SILLY]: 6,
  [LogLevel.NONE]: 7,
}

export class LoggerFactory {
  private static defaultLogLevel: LogLevel = defaultLogLevel
  private static loggers: Map<string, winston.Logger> = new Map()
  private static initialized = false

  static setDefaultLogLevel(level: LogLevel): void {
    this.defaultLogLevel = level
  }

  static get logLevel(): LogLevel {
    return this.defaultLogLevel
  }

  public static getLogger(name?: string, level?: LogLevel): Logger {
    if (!this.initialized) {
      const defaultLogger = winston.createLogger({
        levels: winstonLevels,
        level: defaultLogLevel,
        format: format.label({
          label: "polkadot-hub-api",
        }),
        transports: [
          new transports.Console({
            format: customFormat,
          }),
        ],
      })
      this.loggers.set("default", defaultLogger)
      for (const [loggerName, loggerLevel] of definedLoggers) {
        const newLogger = winston.createLogger({
          levels: winstonLevels,
          level: loggerLevel,
          format: format.label({
            label: loggerName,
          }),
          transports: [
            new transports.Console({
              format: customFormat,
            }),
          ],
        })
        this.loggers.set(loggerName, newLogger)
      }
      this.initialized = true
    }

    if (!name) {
      name = "default" // Default logger name if none is provided
    }

    if (!this.loggers.has(name)) {
      const actualLevel = level || this.defaultLogLevel
      const newLogger = winston.createLogger({
        levels: winstonLevels,
        level: actualLevel,
        format: format.label({
          label: name === "default" ? "polkadot-hub-api" : name,
        }),
        transports: [
          new transports.Console({
            format: customFormat,
          }),
        ],
      })
      this.loggers.set(name, newLogger)
    }
    return this.loggers.get(name)!
  }

  public static get logger(): winston.Logger {
    return LoggerFactory.getLogger()
  }

  public static configureLogger(name: string, level: LogLevel): Logger {
    const logger = LoggerFactory.getLogger(name)
    logger.level = level
    this.loggers.set(name, logger)
    return logger
  }
}
