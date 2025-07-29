import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readdirSync } from "fs";
import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
} from "discord.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const data = new SlashCommandBuilder()
  .setName("help")
  .setDescription(
    "Affiche dynamiquement toutes les commandes disponibles avec leurs options",
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const commandsPath = __dirname;
  const commandFiles = readdirSync(commandsPath).filter(
    (file) => file.endsWith(".ts") || file.endsWith(".js"),
  );

  let commandDescriptions: string[] = [];

  for (const file of commandFiles) {
    if (file === "help.ts" || file === "help.js") continue;

    try {
      const commandModule = await import(join(commandsPath, file));
      const command = commandModule.data;

      if (command?.name && command?.description) {
        let line = `**/${command.name}**`;

        const options = command.options ?? command.options?.options ?? [];

        if (options.length > 0) {
          const optionNames = options
            .map((opt: any) => `<${opt.name}>`)
            .join(" ");
          line += ` ${optionNames}`;
        }

        line += `\n${command.description}`;
        commandDescriptions.push(line);
      }
    } catch (err) {
      console.warn(`❌ Erreur en important ${file}:`, err);
    }
  }

  // Tri alphabétique
  commandDescriptions.sort((a, b) => a.localeCompare(b));

  const embed = new EmbedBuilder()
    .setTitle("📚 Commandes disponibles")
    .setDescription(commandDescriptions.join("\n\n"))
    .setColor(0x2f3136); // Couleur sobre (comme Discord dark)

  await interaction.reply({ embeds: [embed] }); // ✅ PUBLIC & avec embed
}
