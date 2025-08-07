import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readdirSync } from "fs";
import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
} from "discord.js";
import logger from "../utils/logger.js";
import { withErrorHandling } from "../utils/errorHandler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const data = new SlashCommandBuilder()
  .setName("help")
  .setDescription(
    "Affiche dynamiquement toutes les commandes disponibles avec leurs options",
  );

/**
 * Exécute la commande d'aide
 * 
 * @param interaction - L'interaction Discord qui a déclenché la commande
 */
async function executeCommand(interaction: ChatInputCommandInteraction) {
  logger.info(`🔍 /help exécuté`, { command: 'help', user: interaction.user.tag });
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
      logger.warn(`⚠️ Erreur en important ${file}`, { 
        command: 'help', 
        file, 
        error: err 
      });
    }
  }

  // Tri alphabétique
  commandDescriptions.sort((a, b) => a.localeCompare(b));

  const embed = new EmbedBuilder()
    .setTitle("📚 Commandes disponibles")
    .setDescription(commandDescriptions.join("\n\n"))
    .setColor(0x2f3136); // Couleur sobre (comme Discord dark)

  logger.info(`✅ Aide générée avec ${commandDescriptions.length} commandes`, { 
    command: 'help', 
    commandCount: commandDescriptions.length 
  });
  
  await interaction.reply({ embeds: [embed] });
}

/**
 * Exporte la fonction d'exécution de la commande avec gestion des erreurs
 * Cette fonction est appelée par le gestionnaire de commandes Discord
 */
export const execute = withErrorHandling(executeCommand, "help");
