import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import db from "../db.js";

type RegisteredPlayer = {
  name: string;
  idAO: string;
  registeredAt: string;
};

export const data = new SlashCommandBuilder()
  .setName("list")
  .setDescription("Affiche la liste des joueurs enregistrés dans cette guilde");

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

  try {
    const players = db
      .prepare("SELECT name, idAO, registeredAt FROM players WHERE guildId = ?")
      .all(guildId) as RegisteredPlayer[];

    if (players.length === 0) {
      await interaction.editReply(
        "📭 Aucun joueur enregistré dans cette guilde.",
      );
      return;
    }

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

    await interaction.editReply({ embeds: [embed] });
  } catch (err) {
    console.error("❌ Erreur /list :", err);
    await interaction.editReply(
      "❌ Une erreur est survenue lors de la lecture de la base.",
    );
  }
}
