import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import db from "../db.js";

export const data = new SlashCommandBuilder()
  .setName("unregister")
  .setDescription(
    "Supprime un joueur de la liste de cette guilde (admin uniquement)",
  )
  .addStringOption((option) =>
    option
      .setName("pseudo")
      .setDescription("Nom du joueur à supprimer")
      .setRequired(true),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId;
  const pseudo = interaction.options.getString("pseudo", true);

  if (!guildId) {
    await interaction.reply({
      content: "❌ Commande à utiliser dans une guilde.",
      flags: ['Ephemeral'],
    });
    return;
  }

  if (!interaction.memberPermissions?.has("Administrator")) {
    await interaction.reply({
      content: "❌ Seuls les administrateurs peuvent utiliser cette commande.",
      flags: ['Ephemeral'],
    });
    return;
  }

  const deleted = db
    .prepare("DELETE FROM players WHERE name = ? AND guildId = ?")
    .run(pseudo, guildId);

  if (deleted.changes === 0) {
    await interaction.reply(
      `❌ Aucun joueur **${pseudo}** trouvé dans cette guilde.`,
    );
  } else {
    await interaction.reply(`✅ Le joueur **${pseudo}** a été supprimé.`);
  }
}
