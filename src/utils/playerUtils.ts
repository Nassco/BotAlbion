import { ChatInputCommandInteraction } from "discord.js";
import { searchPlayer } from "../services/albionApi.js";
import { PlayerSearchEntry } from "../interfaces/AlbionApiTypes.js";
import logger from "./logger.js";

/**
 * Find a player by name and handle common error cases
 * 
 * @param interaction The Discord interaction
 * @param playerName The name of the player to search for
 * @returns The player object if found, null otherwise (interaction will be replied to with an error message)
 */
export async function findPlayer(
  interaction: ChatInputCommandInteraction,
  playerName: string
): Promise<PlayerSearchEntry | null> {
  try {
    const searchJson = await searchPlayer(playerName);

    if (!searchJson.players?.length) {
      await interaction.reply({
        content: `🚫 Aucun joueur trouvé pour « ${playerName} »`,
        flags: ['Ephemeral'],
      });
      return null;
    }

    return searchJson.players[0];
  } catch (err) {
    logger.error(`❌ Erreur lors de la recherche du joueur ${playerName}`, { playerName, error: err });
    await interaction.reply({
      content: "❌ Impossible de rechercher le joueur. Veuillez réessayer plus tard.",
      flags: ['Ephemeral'],
    });
    return null;
  }
}