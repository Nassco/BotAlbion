import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder,
} from "discord.js";
import { PlayerInfo } from "../interfaces/PlayerInfo.js"; // ← Import du type

const baseUrl = "https://gameinfo-ams.albiononline.com/api/gameinfo";

export const data = new SlashCommandBuilder()
    .setName("playerstats")
    .setDescription(
        "Affiche les statistiques globales d'un joueur Albion Online",
    )
    .addStringOption((option) =>
        option
            .setName("pseudo")
            .setDescription("Nom du joueur")
            .setRequired(true),
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    const pseudo = interaction.options.getString("pseudo", true);
    console.log(`🔍 /playerstats ${pseudo}`);

    try {
        const searchUrl = `${baseUrl}/search?q=${encodeURIComponent(pseudo)}`;
        console.log(`📡 GET ${searchUrl}`);
        const searchRes = await fetch(searchUrl);
        const searchJson = await searchRes.json();

        if (!searchJson.players?.length) {
            return interaction.reply({
                content: `🚫 Aucun joueur trouvé pour « ${pseudo} »`,
                flags: ["Ephemeral"],
            });
        }

        const player = searchJson.players[0];
        const id = player.Id;

        const statsUrl = `${baseUrl}/players/${id}`;
        console.log(`📡 GET ${statsUrl}`);
        const statsRes = await fetch(statsUrl);
        const stats = (await statsRes.json()) as PlayerInfo; // ✅ Cast typé

        console.log(`✅ Stats trouvées pour ${stats.Name} (${stats.Id})`);

        const fameTotal =
            (stats.KillFame ?? 0) +
            (stats.LifetimeStatistics?.PvE?.Total ?? 0) +
            (stats.LifetimeStatistics?.Gathering?.All?.Total ?? 0) +
            (stats.LifetimeStatistics?.Crafting?.Total ?? 0);

        const embed = new EmbedBuilder()
            .setTitle(stats.Name)
            .setThumbnail(
                `https://render.albiononline.com/v1/avatar/${stats.Avatar}.png?ring=${stats.AvatarRing}`,
            )
            .setDescription(
                `**Guilde**: ${stats.GuildName || "Aucune"}\n**Alliance**: ${stats.AllianceName || "Aucune"}`,
            )
            .addFields(
                {
                    name: "🏆 Fame Total",
                    value: fameTotal.toLocaleString(),
                    inline: true,
                },
                {
                    name: "📈 Kill Fame",
                    value: stats.KillFame.toLocaleString(),
                    inline: true,
                },
                {
                    name: "💀 Death Fame",
                    value: stats.DeathFame.toLocaleString(),
                    inline: true,
                },
                {
                    name: "🎯 PvE Fame",
                    value: stats.LifetimeStatistics.PvE.Total.toLocaleString(),
                    inline: true,
                },
                {
                    name: "🏹 Gathering Fame",
                    value: stats.LifetimeStatistics.Gathering.All.Total.toLocaleString(),
                    inline: true,
                },
                {
                    name: "⚒️ Crafting Fame",
                    value: stats.LifetimeStatistics.Crafting.Total.toLocaleString(),
                    inline: true,
                },
                {
                    name: "🎯 K/D Ratio",
                    value: stats.FameRatio.toFixed(2),
                    inline: true,
                },
            )
            .setFooter({ text: `ID : ${stats.Id}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    } catch (err) {
        console.error(`❌ Erreur dans /playerstats :`, err);
        await interaction.reply({
            content: "❌ Impossible de récupérer les infos du joueur.",
            flags: ["Ephemeral"],
        });
    }
}
