import {
    Client,
    GatewayIntentBits,
    ActivityType,
    REST,
    Routes,
    SlashCommandBuilder,
    EmbedBuilder,
    Interaction,
} from "discord.js";
import config from "./config";

const client = new Client({
    intents: [GatewayIntentBits.Guilds],
    presence: {
        status: "online",
        activities: [{ name: "/help", type: ActivityType.Listening }],
    },
});

// Déclaration des commandes
const commands = [
    new SlashCommandBuilder().setName("ping").setDescription("Check latency"),
    new SlashCommandBuilder()
        .setName("say")
        .setDescription("Repeat your message")
        .addStringOption((opt) =>
            opt
                .setName("message")
                .setDescription("Message to repeat")
                .setRequired(true),
        ),
    new SlashCommandBuilder().setName("help").setDescription("List all commands"),
    new SlashCommandBuilder()
        .setName("player")
        .setDescription("Infos d’un joueur Albion Online")
        .addStringOption((opt) =>
            opt
                .setName("pseudo")
                .setDescription("Pseudo du joueur")
                .setRequired(true),
        ),
].map((cmd) => cmd.toJSON());

// Enregistrement des commandes slash
const rest = new REST({ version: "10" }).setToken(config.token!);

(async () => {
    try {
        console.log("📦 Enregistrement des commandes slash...");
        if (!config.clientId || !config.guildId)
            throw new Error("Missing clientId or guildId");
        await rest.put(Routes.applicationCommands(config.clientId), {
            body: commands,
        });
        console.log("✅ Commandes enregistrées avec succès.");
    } catch (err) {
        console.error("❌ Erreur enregistrement :", err);
    }
})();

client.once("ready", () => {
    console.log(`🟢 Bot connecté en tant que ${client.user?.tag}`);
});

client.on("interactionCreate", async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName, options } = interaction;

    if (commandName === "ping") {
        await interaction.reply("🏓 Pong !");
    }

    if (commandName === "say") {
        const msg = options.getString("message", true);
        await interaction.reply(msg);
    }

    if (commandName === "help") {
        const embed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle("Help Menu")
            .addFields(
                { name: "/ping", value: "Check latency" },
                { name: "/say <message>", value: "Repeat your message" },
                {
                    name: "/player <pseudo>",
                    value: "Afficher les infos d’un joueur Albion Online",
                },
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }

    if (commandName === "player") {
        const pseudo = options.getString("pseudo", true);
        const baseUrl = "https://gameinfo-ams.albiononline.com/api/gameinfo";

        const searchUrl = `${baseUrl}/search?q=${encodeURIComponent(pseudo)}`;
        console.log(`[🔍] Requête SEARCH → ${searchUrl}`);

        const searchRes = await fetch(searchUrl);
        const searchJson = await searchRes.json();

        console.log(`[📥] Résultat SEARCH pour "${pseudo}" →`, searchJson);

        if (!searchJson.players?.length) {
            console.log(`[❌] Aucun joueur trouvé pour : ${pseudo}`);
            return interaction.reply({
                content: `🚫 Aucun joueur trouvé pour « ${pseudo} »`,
                ephemeral: true,
            });
        }

        const player = searchJson.players[0];
        const id = player.Id;

        const statsUrl = `${baseUrl}/players/${id}`;
        console.log(`[📊] Requête STATS → ${statsUrl}`);

        const statRes = await fetch(statsUrl);
        const stats = await statRes.json();

        console.log(`[✅] Stats reçues pour ${stats.Name}`, {
            killFame: stats.KillFame,
            deathFame: stats.DeathFame,
            lifetimeStats: stats.LifetimeStatistics,
        });

        const lifetime = stats.LifetimeStatistics ?? {};
        const pve = lifetime.PvE?.Total ?? 0;
        const gathering = lifetime.Gathering?.All?.Total ?? 0;
        const crafting = lifetime.Crafting?.Total ?? 0;

        const killFame = stats.KillFame ?? 0;
        const deathFame = stats.DeathFame ?? 0;

        const totalFame = killFame + pve + gathering + crafting;

        const embed = new EmbedBuilder()
            .setTitle(stats.Name)
            .setDescription(
                `**Guilde**: ${stats.GuildName || "Aucune"}\n**Alliance**: ${stats.AllianceName || "Aucune"}`,
            )
            .addFields(
                {
                    name: "⭐ Fame Totale",
                    value: totalFame.toLocaleString(),
                    inline: false,
                },
                {
                    name: "📈 Kill Fame",
                    value: killFame.toLocaleString(),
                    inline: true,
                },
                {
                    name: "💀 Death Fame",
                    value: deathFame.toLocaleString(),
                    inline: true,
                },
                { name: "🎯 PvE Fame", value: pve.toLocaleString(), inline: true },
                {
                    name: "🏹 Gathering Fame",
                    value: gathering.toLocaleString(),
                    inline: true,
                },
                {
                    name: "🛠 Crafting Fame",
                    value: crafting.toLocaleString(),
                    inline: true,
                },
            )
            .setThumbnail(
                `https://render.albiononline.com/v1/avatar/${stats.Avatar}.png?ring=${stats.AvatarRing}`,
            )
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
});

client.login(config.token);
