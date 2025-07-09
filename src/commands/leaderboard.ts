import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";
import { PlayerInfo } from "../interfaces/PlayerInfo.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PLAYERS_FILE = path.join(__dirname, "..", "data", "players.json");

export const data = new SlashCommandBuilder()
  .setName("leaderboard")
  .setDescription("Classe les joueurs enregistrés selon un type de statistique")
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
  await interaction.deferReply();

  const type = interaction.options.getString("type", true);
  let players: any[] = [];

  try {
    if (!fs.existsSync(PLAYERS_FILE)) {
      await interaction.editReply("📭 Aucun joueur enregistré.");
      return;
    }

    players = JSON.parse(fs.readFileSync(PLAYERS_FILE, "utf8"));
    if (!Array.isArray(players) || players.length === 0) {
      await interaction.editReply("📭 Aucun joueur enregistré.");
      return;
    }
  } catch (err) {
    console.error("❌ Erreur lecture players.json :", err);
    await interaction.editReply(
      "❌ Impossible de lire les joueurs enregistrés.",
    );
    return;
  }

  const results: { name: string; fame: number }[] = [];

  for (const player of players) {
    try {
      const url = `https://gameinfo-ams.albiononline.com/api/gameinfo/players/${player.id}`;
      const res = await fetch(url);
      const data = (await res.json()) as PlayerInfo;

      if (type === "pve") {
        results.push({
          name: player.name,
          fame: data.LifetimeStatistics.PvE.Total,
        });
      } else if (type === "pvp") {
        results.push({
          name: player.name,
          fame: data.KillFame,
        });
      }
    } catch (err) {
      console.warn(`⚠️ Erreur récupération stats pour ${player.name}`, err);
    }
  }

  if (results.length === 0) {
    await interaction.editReply("❌ Aucune donnée récupérée pour les joueurs.");
    return;
  }

  // Tri décroissant
  results.sort((a, b) => b.fame - a.fame);

  const title =
    type === "pve"
      ? "🏆 Leaderboard - PvE Fame"
      : "⚔️ Leaderboard - PvP Kill Fame";

  const lines = results.map(
    (r, i) =>
      `\`${i + 1}.\` **${r.name}** - ${r.fame.toLocaleString("en-US")} fame`,
  );

  await interaction.editReply({
    embeds: [
      {
        title,
        description: lines.join("\n"),
        color: 0xf1c40f,
      },
    ],
  });
}
