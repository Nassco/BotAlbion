import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder,
} from "discord.js";
import { getPlayerInfo } from "../services/albionApi.js";
import { findPlayer } from "../utils/playerUtils.js";
import logger from "../utils/logger.js";
import { withErrorHandling } from "../utils/errorHandler.js";

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

async function executeCommand(interaction: ChatInputCommandInteraction) {
    const pseudo = interaction.options.getString("pseudo", true);
    logger.info(`🔍 /playerstats ${pseudo}`, { command: 'playerstats', pseudo });

    const player = await findPlayer(interaction, pseudo);
    if (!player) return; // findPlayer already replied with an error message
    
    const id = player.Id;

    const stats = await getPlayerInfo(id);

    logger.info(`✅ Stats trouvées pour ${stats.Name} (${stats.Id})`, { 
        command: 'playerstats', 
        player: stats.Name, 
        playerId: stats.Id 
    });

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
}

// Wrap the command execution with error handling
export const execute = withErrorHandling(executeCommand, "playerstats");
