import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import db from "../db.js";

export const data = new SlashCommandBuilder()
  .setName("reset")
  .setDescription(
    "Supprime tous les joueurs de cette guilde (admin uniquement)",
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId;

  if (!guildId) {
    await interaction.reply({
      content: "❌ Commande à utiliser dans une guilde.",
      ephemeral: true,
    });
    return;
  }

  if (!interaction.memberPermissions?.has("Administrator")) {
    await interaction.reply({
      content: "❌ Seuls les administrateurs peuvent utiliser cette commande.",
      ephemeral: true,
    });
    return;
  }

  const deleted = db
    .prepare("DELETE FROM players WHERE guildId = ?")
    .run(guildId);

  if (deleted.changes === 0) {
    await interaction.reply("📭 Aucun joueur à supprimer.");
  } else {
    await interaction.reply(
      `✅ Tous les joueurs (**${deleted.changes}**) ont été supprimés de cette guilde.`,
    );
  }
}
