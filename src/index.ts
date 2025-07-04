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

const client = new Client({
    intents: [GatewayIntentBits.Guilds],
    presence: {
        status: "online",
        activities: [{ name: "/help", type: ActivityType.Listening }],
    },
});

const commands = new Collection<string, any>();
const commandsData = [];

const commandsPath = path.join(__dirname, "commands");
const commandFiles = (await fs.readdir(commandsPath)).filter((file) =>
    file.endsWith(".ts"),
);

for (const file of commandFiles) {
    const command = await import(`./commands/${file}`);
    if (command.data && command.execute) {
        commands.set(command.data.name, command);
        commandsData.push(command.data.toJSON());
    }
}

const rest = new REST({ version: "10" }).setToken(config.token);

// 💡 Enregistrement dans ton serveur de dev
if (!config.guildId) {
    throw new Error("❌ GUILD_ID manquant dans le fichier .env");
}

await rest.put(
    Routes.applicationGuildCommands(config.clientId!, config.guildId),
    { body: commandsData },
);

console.log(
    `✅ ${commands.size} commandes enregistrées dans la guilde de test.`,
);

client.on("ready", () => {
    console.log(`🟢 Connecté en tant que ${client.user?.tag}`);
});

client.on("interactionCreate", async (interaction: Interaction) => {
    if (interaction.isChatInputCommand()) {
        const command = commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: "❌ Une erreur est survenue.",
                ephemeral: true,
            });
        }
    }

    // Ajout pour les boutons (facultatif ici, mais utile si tu veux des handlers globaux plus tard)
    if (interaction.isButton()) {
        console.log(
            `🔘 Bouton cliqué : ${interaction.customId} par ${interaction.user.tag}`,
        );
        // Rien ici pour l’instant : les collectors sont gérés directement dans le message de la commande
    }
});

client.login(config.token);
