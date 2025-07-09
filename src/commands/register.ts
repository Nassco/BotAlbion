import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { registerPlayer } from "../utils/registerPlayer.js"; // Ajuste le chemin si nécessaire

export const data = new SlashCommandBuilder()
  .setName("register")
  .setDescription("Enregistre un joueur Albion pour le killboard")
  .addStringOption((option) =>
    option
      .setName("pseudo")
      .setDescription("Nom du joueur Albion Online")
      .setRequired(true),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const pseudo = interaction.options.getString("pseudo", true);
  await interaction.deferReply();

  try {
    const { success, message } = await registerPlayer(pseudo);
    await interaction.editReply(message);
  } catch (err) {
    console.error("❌ Erreur lors de l'exécution de /register :", err);
    await interaction.editReply(
      "❌ Une erreur est survenue lors de l'enregistrement du joueur.",
    );
  }
}
