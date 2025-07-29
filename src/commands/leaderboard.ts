import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import db from "../db.js";
import fetch from "node-fetch";
import { PlayerInfo } from "../interfaces/PlayerInfo.js";

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
      ephemeral: true,
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

  const results: { name: string; fame: number }[] = [];

  for (const player of players) {
    try {
      const res = await fetch(
        `https://gameinfo-ams.albiononline.com/api/gameinfo/players/${player.idAO}`,
      );
      const data = (await res.json()) as PlayerInfo;

      const fame =
        type === "pve" ? data.LifetimeStatistics.PvE.Total : data.KillFame;

      results.push({ name: player.name, fame });
    } catch (err) {
      console.warn(`⚠️ Erreur pour ${player.name} :`, err);
    }
  }

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
