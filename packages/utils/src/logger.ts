import winston, { transports, format, Logger } from "winston"
import { LogLevel } from "./types"
import fs from "fs"
import path from "path"

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

export function findFileInParentDirs(
  fileName: string,
  startDir: string = process.cwd(),
): string | null {
  let currentDir = path.resolve(startDir)

  while (true) {
    const filePath = path.join(currentDir, fileName)

    // Check if the file exists in the current directory
    if (fs.existsSync(filePath)) {
      return filePath
    }

    const parentDir = path.dirname(currentDir)

    if (parentDir === currentDir) {
      return null
    }

    currentDir = parentDir
  }
}

// TODO: load the configRegistry and get the log config

const configrc = findFileInParentDirs(".phapirc")

let defaultLogLevel: LogLevel = LogLevel.INFO
const definedLoggers: [string, LogLevel][] = []
if (configrc) {
  const config = JSON.parse(fs.readFileSync(configrc, "utf-8"))
  const logConfig = config.log
  // Set global default level if defined in config
  if (
    logConfig.defaultLevel &&
    LogLevel[logConfig.defaultLevel as keyof typeof LogLevel] !== undefined
  ) {
    defaultLogLevel = LogLevel[logConfig.defaultLevel as keyof typeof LogLevel]
  }
  // Configure specific loggers
  if (logConfig.loggers && typeof logConfig.loggers === "object") {
    for (const loggerName in logConfig.loggers) {
      const level = logConfig.loggers[loggerName]
      if (LogLevel[level as keyof typeof LogLevel] !== undefined) {
        definedLoggers.push([
          loggerName,
          LogLevel[level as keyof typeof LogLevel],
        ])
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
