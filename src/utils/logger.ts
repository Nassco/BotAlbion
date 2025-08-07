import winston from 'winston';
import path from 'path';

/**
 * Crée un format personnalisé pour les logs qui inclut l'horodatage, le niveau et le message
 * 
 * @param options - Options du format (level, message, timestamp, metadata)
 * @returns Message formaté pour l'affichage
 */
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

/**
 * Crée l'instance du logger avec les transports et formats configurés
 * Enregistre les logs dans la console et dans des fichiers
 */
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

/**
 * Fonction utilitaire pour obtenir le nom du fichier appelant
 * Utilise la stack trace pour déterminer quel fichier a appelé le logger
 * 
 * @returns Nom du fichier appelant ou 'unknown' si non déterminé
 */
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

/**
 * Exporte un wrapper qui ajoute automatiquement le fichier source au log
 * Fournit des méthodes pour chaque niveau de log
 */
export default {
  /**
   * Enregistre un message de niveau error
   * 
   * @param message - Message à enregistrer
   * @param meta - Métadonnées additionnelles (optionnel)
   */
  error: (message: string, meta?: any) => {
    logger.error(message, { ...meta, source: getCallerFile() });
  },
  /**
   * Enregistre un message de niveau warn
   * 
   * @param message - Message à enregistrer
   * @param meta - Métadonnées additionnelles (optionnel)
   */
  warn: (message: string, meta?: any) => {
    logger.warn(message, { ...meta, source: getCallerFile() });
  },
  /**
   * Enregistre un message de niveau info
   * 
   * @param message - Message à enregistrer
   * @param meta - Métadonnées additionnelles (optionnel)
   */
  info: (message: string, meta?: any) => {
    logger.info(message, { ...meta, source: getCallerFile() });
  },
  /**
   * Enregistre un message de niveau http
   * 
   * @param message - Message à enregistrer
   * @param meta - Métadonnées additionnelles (optionnel)
   */
  http: (message: string, meta?: any) => {
    logger.http(message, { ...meta, source: getCallerFile() });
  },
  /**
   * Enregistre un message de niveau verbose
   * 
   * @param message - Message à enregistrer
   * @param meta - Métadonnées additionnelles (optionnel)
   */
  verbose: (message: string, meta?: any) => {
    logger.verbose(message, { ...meta, source: getCallerFile() });
  },
  /**
   * Enregistre un message de niveau debug
   * 
   * @param message - Message à enregistrer
   * @param meta - Métadonnées additionnelles (optionnel)
   */
  debug: (message: string, meta?: any) => {
    logger.debug(message, { ...meta, source: getCallerFile() });
  },
  /**
   * Enregistre un message de niveau silly
   * 
   * @param message - Message à enregistrer
   * @param meta - Métadonnées additionnelles (optionnel)
   */
  silly: (message: string, meta?: any) => {
    logger.silly(message, { ...meta, source: getCallerFile() });
  }
};