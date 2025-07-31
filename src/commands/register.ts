import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { registerPlayer } from "../utils/registerPlayer.js";

export const data = new SlashCommandBuilder()
  .setName("register")
  .setDescription(
    "Enregistre un joueur Albion pour le killboard de cette guilde",
  )
  .addStringOption((option) =>
    option
      .setName("pseudo")
      .setDescription("Nom du joueur Albion Online")
      .setRequired(true),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const pseudo = interaction.options.getString("pseudo", true);
  const guildId = interaction.guildId;

  if (!guildId) {
    await interaction.reply({
      content: "❌ Cette commande doit être utilisée dans une guilde Discord.",
      flags: ['Ephemeral'],
    });
    return;
  }

  await interaction.deferReply();

  try {
    const { success, message } = await registerPlayer(pseudo, guildId);
    await interaction.editReply(message);
  } catch (err) {
    console.error("❌ Erreur lors de /register :", err);
    await interaction.editReply(
      "❌ Une erreur est survenue lors de l'enregistrement du joueur.",
    );
  }
}
