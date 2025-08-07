import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import db from "../db.js";
import logger from "../utils/logger.js";
import { withErrorHandling, createError, ErrorType } from "../utils/errorHandler.js";

type RegisteredPlayer = {
  name: string;
  idAO: string;
  registeredAt: string;
};

export const data = new SlashCommandBuilder()
  .setName("list")
  .setDescription("Affiche la liste des joueurs enregistrés dans cette guilde");

/**
 * Exécute la commande de liste des joueurs
 * 
 * @param interaction - L'interaction Discord qui a déclenché la commande
 * @throws Erreur si aucun joueur n'est enregistré ou si la base de données est inaccessible
 */
async function executeCommand(interaction: ChatInputCommandInteraction) {
  logger.info(`🔍 /list exécuté`, { command: 'list', user: interaction.user.tag });
  const guildId = interaction.guildId;
  if (!guildId) {
    await interaction.reply({
      content: "❌ Cette commande doit être utilisée dans une guilde Discord.",
      flags: ['Ephemeral'],
    });
    return;
  }

  await interaction.deferReply();

  const players = db
    .prepare("SELECT name, idAO, registeredAt FROM players WHERE guildId = ?")
    .all(guildId) as RegisteredPlayer[];

  if (players.length === 0) {
    logger.warn(`⚠️ Aucun joueur enregistré pour la guilde ${guildId}`, { 
      command: 'list', 
      guildId 
    });
    throw createError("No players registered for this guild", ErrorType.NOT_FOUND_ERROR);
  }

  logger.info(`📥 ${players.length} joueurs trouvés pour la guilde ${guildId}`, { 
    command: 'list', 
    guildId,
    playerCount: players.length 
  });

  const list = players
    .map((p, i) => {
      const date = new Date(p.registeredAt).toLocaleDateString("fr-FR");
      return `\`${i + 1}.\` **${p.name}** *(ID: \`${p.idAO}\`, inscrit le ${date})*`;
    })
    .join("\n");

  const embed = new EmbedBuilder()
    .setTitle("📋 Joueurs enregistrés")
    .setDescription(list)
    .setColor(0x3498db);

  logger.info(`✅ Liste générée avec ${players.length} joueurs`, { 
    command: 'list', 
    playerCount: players.length 
  });
  
  await interaction.editReply({ embeds: [embed] });
}

/**
 * Exporte la fonction d'exécution de la commande avec gestion des erreurs
 * Cette fonction est appelée par le gestionnaire de commandes Discord
 */
export const execute = withErrorHandling(executeCommand, "list");
