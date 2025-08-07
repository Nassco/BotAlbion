import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import logger from "../utils/logger.js";
import { withErrorHandling } from "../utils/errorHandler.js";

/**
 * Configuration de la commande slash Discord pour le ping
 */
export const data = new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Répond Pong!");

/**
 * Exécute la commande ping
 * 
 * @param interaction - L'interaction Discord qui a déclenché la commande
 */
async function executeCommand(interaction: ChatInputCommandInteraction) {
    logger.info(`🔍 /ping exécuté`, { command: 'ping', user: interaction.user.tag });
    
    await interaction.reply("🏓 Pong!");
    
    logger.info(`✅ Réponse ping envoyée`, { command: 'ping' });
}

/**
 * Exporte la fonction d'exécution de la commande avec gestion des erreurs
 * Cette fonction est appelée par le gestionnaire de commandes Discord
 */
export const execute = withErrorHandling(executeCommand, "ping");
