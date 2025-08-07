import winston from 'winston';
import path from 'path';

// Create a custom format that includes timestamp, log level, and message
const customFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
  // Format the timestamp to be more readable
  // @ts-ignore
    const formattedTimestamp = new Date(timestamp).toISOString().replace('T', ' ').substring(0, 19);
  
  // Add emoji based on log level for better visual distinction
  const emoji = {
    error: '❌',
    warn: '⚠️',
    info: '📢',
    http: '🌐',
    verbose: '🔍',
    debug: '🐛',
    silly: '🤪'
  }[level] || '';
  
  // Format the message with emoji, timestamp, and level
  let logMessage = `${emoji} ${formattedTimestamp} [${level.toUpperCase()}]: ${message}`;
  
  // Add metadata if present
  if (Object.keys(metadata).length > 0 && metadata.constructor === Object) {
    logMessage += ` ${JSON.stringify(metadata)}`;
  }
  
  return logMessage;
});

// Create the logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info', // Default to 'info' if not specified
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    customFormat
  ),
  transports: [
    // Console transport for all logs
    new winston.transports.Console(),
    
    // File transport for errors
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),
    
    // File transport for all logs
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ]
});

// Add source file information to log messages in development
if (process.env.NODE_ENV !== 'production') {
  logger.format = winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    winston.format.printf(info => {
      // Get caller file and line
      const err = new Error();
      const callerLine = err.stack?.split('\n')[3];
      const fileInfo = callerLine ? ` (${callerLine.trim().split('(')[1].split(')')[0]})` : '';
      
      return `${info.timestamp} [${info.level}]${fileInfo}: ${info.message}`;
    })
  );
}

// Helper function to get the calling file name
function getCallerFile() {
  const err = new Error();
  const stack = err.stack?.split('\n')[3];
  // Extract filename from the stack trace
  const match = stack?.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
  if (match) {
    return path.basename(match[2]);
  }
  return 'unknown';
}

// Export a wrapper that adds the source file to the log
export default {
  error: (message: string, meta?: any) => {
    logger.error(message, { ...meta, source: getCallerFile() });
  },
  warn: (message: string, meta?: any) => {
    logger.warn(message, { ...meta, source: getCallerFile() });
  },
  info: (message: string, meta?: any) => {
    logger.info(message, { ...meta, source: getCallerFile() });
  },
  http: (message: string, meta?: any) => {
    logger.http(message, { ...meta, source: getCallerFile() });
  },
  verbose: (message: string, meta?: any) => {
    logger.verbose(message, { ...meta, source: getCallerFile() });
  },
  debug: (message: string, meta?: any) => {
    logger.debug(message, { ...meta, source: getCallerFile() });
  },
  silly: (message: string, meta?: any) => {
    logger.silly(message, { ...meta, source: getCallerFile() });
  }
};