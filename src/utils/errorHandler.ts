import { ChatInputCommandInteraction } from "discord.js";
import logger from "./logger.js";

/**
 * Types d'erreurs pour une gestion cohérente des erreurs
 */
export enum ErrorType {
  API_ERROR = "API_ERROR",
  TIMEOUT_ERROR = "TIMEOUT_ERROR",
  NOT_FOUND_ERROR = "NOT_FOUND_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  PERMISSION_ERROR = "PERMISSION_ERROR",
  INTERNAL_ERROR = "INTERNAL_ERROR"
}

/**
 * Interface pour les informations d'erreur structurées
 */
export interface ErrorInfo {
  type: ErrorType;
  message: string;
  command?: string;
  details?: any;
  userMessage?: string;
}

/**
 * Gère les erreurs de manière cohérente pour toutes les commandes
 * 
 * @param error - L'erreur qui s'est produite
 * @param interaction - L'interaction Discord
 * @param commandName - Le nom de la commande où l'erreur s'est produite
 * @param metadata - Métadonnées supplémentaires pour la journalisation
 * @returns void
 */
export async function handleCommandError(
  error: unknown,
  interaction: ChatInputCommandInteraction,
  commandName: string,
  metadata: Record<string, any> = {}
): Promise<void> {
  // Default error info
  let errorInfo: ErrorInfo = {
    type: ErrorType.INTERNAL_ERROR,
    message: "An unexpected error occurred",
    command: commandName,
    userMessage: "❌ Une erreur inattendue s'est produite."
  };

  // Determine error type and create appropriate error info
  if (error instanceof Error) {
    // Extract error type from known error messages
    if (error.message.includes("timeout") || error.message.includes("AbortError")) {
      errorInfo = {
        type: ErrorType.TIMEOUT_ERROR,
        message: `Request timeout in ${commandName} command: ${error.message}`,
        command: commandName,
        details: { originalError: error },
        userMessage: "⏱️ La requête a pris trop de temps. Veuillez réessayer plus tard."
      };
    } else if (error.message.includes("API request failed")) {
      errorInfo = {
        type: ErrorType.API_ERROR,
        message: `API error in ${commandName} command: ${error.message}`,
        command: commandName,
        details: { originalError: error },
        userMessage: "❌ Impossible de récupérer les données de l'API Albion. Veuillez réessayer plus tard."
      };
    } else if (error.message.includes("not found") || error.message.includes("No results")) {
      errorInfo = {
        type: ErrorType.NOT_FOUND_ERROR,
        message: `Resource not found in ${commandName} command: ${error.message}`,
        command: commandName,
        details: { originalError: error },
        userMessage: "🔍 Aucun résultat trouvé. Vérifiez l'orthographe et réessayez."
      };
    } else {
      // Generic error with the original error message
      errorInfo = {
        type: ErrorType.INTERNAL_ERROR,
        message: `Error in ${commandName} command: ${error.message}`,
        command: commandName,
        details: { originalError: error },
        userMessage: "❌ Une erreur s'est produite lors de l'exécution de la commande."
      };
    }
  }

  // Log the error with all available information
  logger.error(errorInfo.message, {
    command: commandName,
    errorType: errorInfo.type,
    ...metadata,
    error
  });

  // Reply to the user with an appropriate message
  try {
    // Check if the interaction has already been replied to or deferred
    if (interaction.deferred) {
      await interaction.editReply({
        content: errorInfo.userMessage,
      });
    } else if (!interaction.replied) {
      await interaction.reply({
        content: errorInfo.userMessage,
        ephemeral: true
      });
    }
  } catch (replyError) {
    // If replying fails, log this additional error
    logger.error(`Failed to reply to interaction after error: ${replyError}`, {
      command: commandName,
      originalError: errorInfo,
      replyError
    });
  }
}

/**
 * Crée une erreur personnalisée avec un type d'erreur spécifique
 * 
 * @param message - Message d'erreur
 * @param type - Type d'erreur
 * @returns Erreur personnalisée avec type
 */
export function createError(message: string, type: ErrorType): Error {
  const error = new Error(message);
  (error as any).errorType = type;
  return error;
}

/**
 * Enveloppe une fonction d'exécution de commande avec gestion des erreurs
 * 
 * @param commandFn - La fonction d'exécution de commande à envelopper
 * @param commandName - Le nom de la commande
 * @returns Fonction enveloppée avec gestion des erreurs
 */
export function withErrorHandling(
  commandFn: (interaction: ChatInputCommandInteraction) => Promise<void>,
  commandName: string
): (interaction: ChatInputCommandInteraction) => Promise<void> {
  return async (interaction: ChatInputCommandInteraction) => {
    try {
      // Log command execution
      logger.info(`🔍 /${commandName} command executed`, {
        command: commandName,
        user: interaction.user.tag,
        options: interaction.options.data.map(opt => ({ name: opt.name, value: opt.value }))
      });
      
      // Execute the command
      await commandFn(interaction);
    } catch (error) {
      // Handle any errors
      await handleCommandError(error, interaction, commandName, {
        user: interaction.user.tag,
        options: interaction.options.data.map(opt => ({ name: opt.name, value: opt.value }))
      });
    }
  };
}