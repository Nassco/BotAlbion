import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder,
} from "discord.js";
import logger from "../utils/logger.js";
import { withErrorHandling, createError, ErrorType } from "../utils/errorHandler.js";

const baseUrl = "https://gameinfo-ams.albiononline.com/api/gameinfo";

export const data = new SlashCommandBuilder()
    .setName("guild")
    .setDescription("Affiche les informations d'une guilde Albion Online")
    .addStringOption((option) =>
        option
            .setName("nom")
            .setDescription("Nom de la guilde")
            .setRequired(true),
    );

async function executeCommand(interaction: ChatInputCommandInteraction) {
    const nomGuilde = interaction.options.getString("nom", true);

    logger.info(`🔍 /guild ${nomGuilde}`, { command: 'guild', guildName: nomGuilde });
    const searchUrl = `${baseUrl}/search?q=${encodeURIComponent(nomGuilde)}`;
    logger.http(`📤 Requête : GET ${searchUrl}`, { command: 'guild', url: searchUrl });

    const searchRes = await fetch(searchUrl);
    const searchJson = await searchRes.json();

    if (!searchJson.guilds?.length) {
        logger.warn(`⚠️ Aucune guilde trouvée pour "${nomGuilde}".`, { command: 'guild', guildName: nomGuilde });
        throw createError(`No guild found with name: ${nomGuilde}`, ErrorType.NOT_FOUND_ERROR);
    }

    const guilde = searchJson.guilds[0];
    const guildId = guilde.Id;

    logger.info(`✅ Guilde trouvée : ${guilde.Name} (ID: ${guildId})`, { 
        command: 'guild', 
        guildName: guilde.Name, 
        guildId 
    });
    
    const infoUrl = `${baseUrl}/guilds/${guildId}`;
    logger.http(`📤 Requête : GET ${infoUrl}`, { command: 'guild', url: infoUrl });

    const infosRes = await fetch(infoUrl);
    const infos = await infosRes.json();

    logger.info(`📥 Données récupérées pour la guilde : ${infos.Name}`, { 
        command: 'guild', 
        guildName: infos.Name 
    });

    const embed = new EmbedBuilder()
        .setTitle(infos.Name)
        .setDescription(`🛡️ Alliance : ${infos.AllianceTag || "Aucune"}`)
        .addFields(
            {
                name: "📅 Créée le",
                value: new Date(infos.Founded).toLocaleDateString(),
                inline: true,
            },
            {
                name: "👑 Fondateur",
                value: infos.FounderName || "Inconnu",
                inline: true,
            },
            {
                name: "👥 Membres",
                value: infos.MemberCount?.toString() ?? "0",
                inline: true,
            },
            {
                name: "🏆 Kill Fame",
                value: infos.killFame?.toLocaleString() ?? "0",
                inline: true,
            },
            {
                name: "💀 Death Fame",
                value: infos.DeathFame?.toLocaleString() ?? "0",
                inline: true,
            },
        )
        .setFooter({ text: `ID : ${infos.Id}` })
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
}

// Wrap the command execution with error handling
export const execute = withErrorHandling(executeCommand, "guild");
