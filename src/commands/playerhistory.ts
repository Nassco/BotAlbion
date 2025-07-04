import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
} from "discord.js";

const baseUrl = "https://gameinfo-ams.albiononline.com/api/gameinfo";
const emojiNumbers = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣"];

export const data = new SlashCommandBuilder()
    .setName("playerhistory")
    .setDescription(
        "Affiche les kills ou morts récents d'un joueur Albion Online",
    )
    .addStringOption((option) =>
        option
            .setName("pseudo")
            .setDescription("Nom du joueur")
            .setRequired(true),
    )
    .addStringOption((option) =>
        option
            .setName("type")
            .setDescription("Type d'historique")
            .addChoices(
                { name: "Kills", value: "kills" },
                { name: "Morts", value: "deaths" },
            )
            .setRequired(true),
    );

function formatDateFR(dateStr: string): string {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export async function execute(interaction: ChatInputCommandInteraction) {
    const pseudo = interaction.options.getString("pseudo", true);
    const type = interaction.options.getString("type", true);

    console.log(`🔍 /playerhistory ${pseudo} (${type})`);

    try {
        const searchUrl = `${baseUrl}/search?q=${encodeURIComponent(pseudo)}`;
        console.log(`📡 GET ${searchUrl}`);
        const searchRes = await fetch(searchUrl);
        const searchJson = await searchRes.json();

        if (!searchJson.players?.length) {
            return interaction.reply({
                content: `🚫 Aucun joueur trouvé pour « ${pseudo} »`,
                ephemeral: true,
            });
        }

        const player = searchJson.players[0];
        const playerId = player.Id;

        const historyUrl = `${baseUrl}/players/${playerId}/${type}`;
        console.log(`📡 GET ${historyUrl}`);
        const historyRes = await fetch(historyUrl);
        const history = await historyRes.json();

        if (!Array.isArray(history) || history.length === 0) {
            return interaction.reply({
                content: `Aucun ${type === "kills" ? "kill" : "mort"} récent trouvé pour ${pseudo}.`,
                ephemeral: true,
            });
        }

        const title =
            type === "kills"
                ? `⚔️ Derniers kills de ${pseudo}`
                : `💀 Dernières morts de ${pseudo}`;
        const color = type === "kills" ? 0x00cc99 : 0xff0000;

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setColor(color)
            .setTimestamp();

        const rows: ActionRowBuilder<ButtonBuilder>[] = [];

        const buttons = history.slice(0, 5).map((entry: any, index: number) => {
            const timestamp = formatDateFR(entry.TimeStamp);
            embed.addFields({
                name: `#${index + 1} - ${timestamp}`,
                value:
                    type === "kills"
                        ? `Victime : ${entry.Victim?.Name || "Inconnue"}\nFame gagné : ${(entry.TotalVictimKillFame ?? 0).toLocaleString()}`
                        : `Tueur : ${entry.Killer?.Name || "Inconnu"}\nFame perdu : ${(entry.TotalVictimKillFame ?? 0).toLocaleString()}`,
            });

            return new ButtonBuilder()
                .setCustomId(`history_${index}`)
                .setStyle(ButtonStyle.Secondary)
                .setEmoji(emojiNumbers[index]); // ← ici on met l'emoji
        });

        rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(buttons));

        await interaction.reply({ embeds: [embed], components: rows });

        const message = await interaction.fetchReply();

        const collector = message.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 30_000,
        });

        collector.on("collect", async (i) => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({
                    content: "❌ Ce bouton ne vous est pas destiné.",
                    ephemeral: true,
                });
            }

            const index = parseInt(i.customId.replace("history_", ""), 10);
            const selected = history[index];

            const killer = selected.Killer || {};
            const victim = selected.Victim || {};

            const detailEmbed = new EmbedBuilder()
                .setTitle(
                    type === "kills"
                        ? "🗡️ Détails du kill"
                        : "☠️ Détails de la mort",
                )
                .setColor(color)
                .addFields(
                    {
                        name: "📅 Date",
                        value: formatDateFR(selected.TimeStamp),
                        inline: false,
                    },
                    {
                        name: "🛡️ Tueur",
                        value: `**Nom**: ${killer.Name || "?"}\n**Guilde**: ${killer.GuildName || "?"}\n**IP Moyenne**: ${Math.round(killer.AverageItemPower || 0)}`,
                        inline: true,
                    },
                    {
                        name: "⚰️ Victime",
                        value: `**Nom**: ${victim.Name || "?"}\n**Guilde**: ${victim.GuildName || "?"}\n**IP Moyenne**: ${Math.round(victim.AverageItemPower || 0)}`,
                        inline: true,
                    },
                    {
                        name: "📊 Fame",
                        value: `${(selected.TotalVictimKillFame ?? 0).toLocaleString()}`,
                        inline: false,
                    },
                )
                .setFooter({ text: `Combat #${index + 1}` })
                .setTimestamp();

            await i.reply({ embeds: [detailEmbed], ephemeral: true });
        });

        collector.on("end", () => {
            message.edit({ components: [] }).catch(() => {});
        });
    } catch (err) {
        console.error(`❌ Erreur dans /playerhistory :`, err);
        await interaction.reply({
            content: "❌ Impossible de récupérer les données du joueur.",
            ephemeral: true,
        });
    }
}
