import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PLAYERS_FILE = path.join(__dirname, "..", "data", "players.json");

export const data = new SlashCommandBuilder()
  .setName("list")
  .setDescription("Affiche la liste des joueurs enregistrés");

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  try {
    if (!fs.existsSync(PLAYERS_FILE)) {
      await interaction.editReply("📭 Aucun joueur enregistré.");
      return;
    }

    const raw = fs.readFileSync(PLAYERS_FILE, "utf8");
    const players = JSON.parse(raw);

    if (!Array.isArray(players) || players.length === 0) {
      await interaction.editReply("📭 Aucun joueur enregistré.");
      return;
    }

    const list = players
      .map(
        (p: any, i: number) =>
          `\`${i + 1}.\` **${p.name}** *(ID: \`${p.id}\`)*`,
      )
      .join("\n");

    await interaction.editReply({
      embeds: [
        {
          title: "📋 Joueurs enregistrés",
          description: list,
          color: 0x3498db,
        },
      ],
    });
  } catch (err) {
    console.error("❌ Erreur /list :", err);
    await interaction.editReply(
      "❌ Une erreur est survenue lors de la lecture du fichier.",
    );
  }
}
