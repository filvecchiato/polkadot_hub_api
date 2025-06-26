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
  private static defaultLogLevel: LogLevel = LogLevel.INFO
  private static loggers: Map<string, winston.Logger> = new Map()
  private static localConfigLoaded = false

  static setDefaultLogLevel(level: LogLevel): void {
    this.defaultLogLevel = level
  }

  static get logLevel(): LogLevel {
    return this.defaultLogLevel
  }

  public static getLogger(name?: string, level?: LogLevel): Logger {
    if (!this.localConfigLoaded) {
      this.loadConfigAndApply() // Load config only once
      this.localConfigLoaded = true
    }

    if (!name) {
      name = "default" // Default logger name if none is provided
    }

    if (!this.loggers.has(name)) {
      const actualLevel = level || this.defaultLogLevel
      const newLogger = winston.createLogger({
        levels: winstonLevels, // Use our custom levels mapping
        level: actualLevel,
        format: format.label({
          label: name === "default" ? "polkadot-hub-api" : name,
        }), // Add the logger name as a label
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
    const logger = LoggerFactory.getLogger(name) // Get existing or create new with current default
    logger.level = level
    this.loggers.set(name, logger) // Update the logger in the map
    return logger
  }

  public static loadConfigAndApply(projectRoot: string = process.cwd()): void {
    const rootSplit = projectRoot.split("/")
    const root = rootSplit.lastIndexOf("packages")
    let file = ".phapirc"
    if (root >= 0) {
      const diff = rootSplit.length - root
      let navigation = ""
      for (let i = 0; i < diff; i++) {
        navigation += "../"
      }
      file = path.join(navigation, file)
    }
    const configFilePath = path.join(projectRoot, file)

    try {
      if (fs.existsSync(configFilePath)) {
        const configFileContent = fs.readFileSync(configFilePath, "utf8")
        const config = JSON.parse(configFileContent)

        if (config.log) {
          const logConfig = config.log

          // Set global default level if defined in config
          if (
            logConfig.defaultLevel &&
            LogLevel[logConfig.defaultLevel as keyof typeof LogLevel] !==
              undefined
          ) {
            LoggerFactory.setDefaultLogLevel(
              LogLevel[logConfig.defaultLevel as keyof typeof LogLevel],
            )
            console.log(
              `[LoggerConfig] Default log level set to: ${logConfig.defaultLevel}`,
            )
          }

          // Configure specific loggers
          if (logConfig.loggers && typeof logConfig.loggers === "object") {
            for (const loggerName in logConfig.loggers) {
              if (
                Object.prototype.hasOwnProperty.call(
                  logConfig.loggers,
                  loggerName,
                )
              ) {
                const level = logConfig.loggers[loggerName]
                if (LogLevel[level as keyof typeof LogLevel] !== undefined) {
                  LoggerFactory.configureLogger(
                    loggerName,
                    LogLevel[level as keyof typeof LogLevel],
                  )
                } else {
                  console.warn(
                    `[LoggerConfig] Invalid log level "${level}" for logger "${loggerName}" in .phapirc. Skipping.`,
                  )
                }
              }
            }
          }
        }
      } else {
        console.info(
          `[LoggerConfig] No .phapirc file found at ${configFilePath}. Using default logging levels.`,
        )
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error(
        `[LoggerConfig] Error reading or parsing .phapirc file: ${error.message}`,
      )
    }
  }
}
