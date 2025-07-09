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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🔁 Initialisation du bot...");

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

    console.log(`📁 ${commandFiles.length} fichiers de commande détectés.`);

    for (const file of commandFiles) {
        const command = await import(`./commands/${file}`);
        if (command.data && command.execute) {
            commands.set(command.data.name, command);
            commandsData.push(command.data.toJSON());
            console.log(`✅ Commande chargée : ${command.data.name}`);
        } else {
            console.warn(`⚠️  Fichier ignoré (structure incorrecte) : ${file}`);
        }
    }
} catch (err) {
    console.error("❌ Erreur lors du chargement des commandes :", err);
    process.exit(1);
}

const rest = new REST({ version: "10" }).setToken(config.token);

try {
    if (!config.guildIds || config.guildIds.length === 0) {
        throw new Error("❌ GUILD_IDS manquant dans .env ou vide.");
    }

    console.log("📡 Enregistrement des commandes sur les guildes de dev...");

    const controller = new AbortController();
    const timeout = setTimeout(() => {
        controller.abort();
        console.error(
            "⏰ Timeout atteint : l'enregistrement des commandes est trop long.",
        );
    }, 15000);

    for (const guildId of config.guildIds) {
        console.log(`🔧 Enregistrement dans la guilde ${guildId}...`);
        await rest.put(
            Routes.applicationGuildCommands(config.clientId!, guildId),
            { body: commandsData, signal: controller.signal },
        );
    }

    clearTimeout(timeout);
    console.log(
        `✅ ${commands.size} commande(s) enregistrée(s) dans ${config.guildIds.length} guilde(s).`,
    );
} catch (err) {
    console.error("❌ Erreur lors de l'enregistrement des commandes :", err);
    process.exit(1);
}

client.once("ready", () => {
    console.log(`🟢 Connecté en tant que ${client.user?.tag}`);
});

client.on("interactionCreate", async (interaction: Interaction) => {
    if (interaction.isChatInputCommand()) {
        const command = commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error("❌ Erreur dans la commande :", error);
            await interaction.reply({
                content: "❌ Une erreur est survenue.",
                flags: ["Ephemeral"],
            });
        }
    }

    if (interaction.isButton()) {
        console.log(
            `🔘 Bouton cliqué : ${interaction.customId} par ${interaction.user.tag}`,
        );
    }
});

try {
    console.log("🔐 Connexion à Discord...");
    await client.login(config.token);
} catch (err) {
    console.error("❌ Échec de la connexion à Discord :", err);
    process.exit(1);
}
