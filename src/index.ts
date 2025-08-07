import {
    Client,
    GatewayIntentBits,
    REST,
    Routes,
    Collection,
    Interaction,
    ActivityType,
} from "discord.js";
import * as fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import config from "./config.ts";
import logger from "./utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

logger.info("🔁 Initialisation du bot...");

const client = new Client({
    intents: [GatewayIntentBits.Guilds],
    presence: {
        status: "online",
        activities: [{ name: "/help", type: ActivityType.Listening }],
    },
});

const commands = new Collection<string, any>();
const commandsData = [];

try {
    const commandsPath = path.join(__dirname, "commands");
    const commandFiles = (await fs.readdir(commandsPath)).filter((file) =>
        file.endsWith(".ts"),
    );

    logger.info(`📁 ${commandFiles.length} fichiers de commande détectés.`);

    for (const file of commandFiles) {
        const command = await import(`./commands/${file}`);
        if (command.data && command.execute) {
            commands.set(command.data.name, command);
            commandsData.push(command.data.toJSON());
            logger.info(`✅ Commande chargée : ${command.data.name}`);
        } else {
            logger.warn(`⚠️  Fichier ignoré (structure incorrecte) : ${file}`);
        }
    }
} catch (err) {
    logger.error("❌ Erreur lors du chargement des commandes :", { error: err });
    process.exit(1);
}

const rest = new REST({ version: "10" }).setToken(config.token);

try {
    if (!config.guildIds || config.guildIds.length === 0) {
        throw new Error("❌ GUILD_IDS manquant dans .env ou vide.");
    }

    logger.info("📡 Enregistrement des commandes sur les guildes de dev...");

    const controller = new AbortController();
    const timeout = setTimeout(() => {
        controller.abort();
        logger.error(
            "⏰ Timeout atteint : l'enregistrement des commandes est trop long."
        );
    }, 15000);

    for (const guildId of config.guildIds) {
        logger.info(`🔧 Enregistrement dans la guilde ${guildId}...`);
        await rest.put(
            Routes.applicationGuildCommands(config.clientId!, guildId),
            { body: commandsData, signal: controller.signal },
        );
    }

    clearTimeout(timeout);
    logger.info(
        `✅ ${commands.size} commande(s) enregistrée(s) dans ${config.guildIds.length} guilde(s).`,
    );
} catch (err) {
    logger.error("❌ Erreur lors de l'enregistrement des commandes :", { error: err });
    process.exit(1);
}

client.once("ready", () => {
    logger.info(`🟢 Connecté en tant que ${client.user?.tag}`);
});

client.on("interactionCreate", async (interaction: Interaction) => {
    if (interaction.isChatInputCommand()) {
        const command = commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            logger.error("❌ Erreur dans la commande :", { 
                command: interaction.commandName,
                error 
            });
            await interaction.reply({
                content: "❌ Une erreur est survenue.",
                flags: ["Ephemeral"],
            });
        }
    }

    if (interaction.isButton()) {
        logger.debug(
            `🔘 Bouton cliqué : ${interaction.customId} par ${interaction.user.tag}`,
            { customId: interaction.customId, user: interaction.user.tag }
        );
    }
});

try {
    logger.info("🔐 Connexion à Discord...");
    await client.login(config.token);
} catch (err) {
    logger.error("❌ Échec de la connexion à Discord :", { error: err });
    process.exit(1);
}
