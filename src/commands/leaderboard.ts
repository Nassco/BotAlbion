import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import db from "../db.js";
import { getPlayerInfo } from "../services/albionApi.js";
import { PlayerInfo } from "../interfaces/PlayerInfo.js";
import logger from "../utils/logger.js";

type RegisteredPlayer = {
  name: string;
  idAO: string;
};

export const data = new SlashCommandBuilder()
  .setName("leaderboard")
  .setDescription(
    "Classe les joueurs de cette guilde selon un type de statistique",
  )
  .addStringOption((option) =>
    option
      .setName("type")
      .setDescription("Type de comparaison (pve ou pvp)")
      .setRequired(true)
      .addChoices(
        { name: "PvE Fame", value: "pve" },
        { name: "PvP Fame", value: "pvp" },
      ),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId;
  if (!guildId) {
    await interaction.reply({
      content: "❌ Cette commande doit être utilisée dans une guilde Discord.",
      flags: ['Ephemeral'],
    });
    return;
  }

  await interaction.deferReply();

  const type = interaction.options.getString("type", true);

  const players = db
    .prepare("SELECT name, idAO FROM players WHERE guildId = ?")
    .all(guildId) as RegisteredPlayer[];

  if (players.length === 0) {
    await interaction.editReply(
      "📭 Aucun joueur enregistré pour cette guilde.",
    );
    return;
  }

  // Utiliser Promise.all pour exécuter les requêtes en parallèle
  const fetchPromises = players.map(async (player) => {
    try {
      const data = await getPlayerInfo(player.idAO);
      const fame = type === "pve" ? data.LifetimeStatistics.PvE.Total : data.KillFame;
      
      return { name: player.name, fame };
    } catch (err) {
      logger.warn(`⚠️ Erreur pour ${player.name}`, { 
        command: 'leaderboard', 
        player: player.name, 
        playerId: player.idAO, 
        error: err 
      });
      return null;
    }
  });

  const fetchResults = await Promise.all(fetchPromises);
  const results = fetchResults.filter((result): result is { name: string; fame: number } => result !== null);

  if (results.length === 0) {
    await interaction.editReply("❌ Aucune donnée récupérée.");
    return;
  }

  results.sort((a, b) => b.fame - a.fame);

  const title = type === "pve" ? "🏆 Leaderboard PvE" : "⚔️ Leaderboard PvP";

  const medals = ["🥇", "🥈", "🥉"];
  const lines = results.map((r, i) => {
    const prefix = medals[i] ?? `\`${i + 1}.\``;
    return `${prefix} **${r.name}** — ${r.fame.toLocaleString("en-US")} fame`;
  });

  const embed = new EmbedBuilder()
    .setTitle(title + " (guilde actuelle)")
    .setDescription(lines.join("\n"))
    .setColor(0xf1c40f);

  await interaction.editReply({ embeds: [embed] });
}
