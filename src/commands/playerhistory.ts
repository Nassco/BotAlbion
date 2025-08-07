import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
} from "discord.js";
import { getPlayerHistory, estimateEquipmentValue } from "../services/albionApi.js";
import { EMOJI_NUMBERS, BUTTON_COLLECTOR_TIMEOUT } from "../constants.js";
import { HistoryEntry } from "../interfaces/AlbionApiTypes.js";
import { findPlayer } from "../utils/playerUtils.js";
import logger from "../utils/logger.js";
import { withErrorHandling, createError, ErrorType } from "../utils/errorHandler.js";

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

type EquipmentItem = {
    Type: string;
    Quality: number;
};

async function executeCommand(interaction: ChatInputCommandInteraction) {
    const pseudo = interaction.options.getString("pseudo", true);
    const type = interaction.options.getString("type", true);

    logger.info(`🔍 /playerhistory ${pseudo} (${type})`, { 
        command: 'playerhistory', 
        pseudo, 
        type 
    });

    const player = await findPlayer(interaction, pseudo);
    if (!player) return; // findPlayer already replied with an error message
    
    const playerId = player.Id;

    const history = await getPlayerHistory(playerId, type as "kills" | "deaths");

    if (!Array.isArray(history) || history.length === 0) {
        logger.warn(`⚠️ Aucun ${type} trouvé pour "${pseudo}"`, { command: 'playerhistory', pseudo, type });
        throw createError(`No ${type} found for player: ${pseudo}`, ErrorType.NOT_FOUND_ERROR);
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

    const buttons = history.slice(0, 5).map((entry: HistoryEntry, index: number) => {
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
            .setEmoji(EMOJI_NUMBERS[index]);
    });

    rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(buttons));

    await interaction.reply({ embeds: [embed], components: rows });

    const message = await interaction.fetchReply();

    const collector = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: BUTTON_COLLECTOR_TIMEOUT,
    });

    collector.on("collect", async (i) => {
        if (i.user.id !== interaction.user.id) {
            return i.reply({
                content: "❌ Ce bouton ne vous est pas destiné.",
                flags: ['Ephemeral'],
            });
        }

        try {
            const index = parseInt(i.customId.replace("history_", ""), 10);
            const selected = history[index];

            const killer = selected.Killer || {};
            const victim = selected.Victim || {};

            logger.info(`🔍 Détails demandés pour le combat #${index + 1}`, { 
                command: 'playerhistory', 
                pseudo, 
                type,
                combatIndex: index 
            });

            const [killerValue, victimValue] = await Promise.all([
                estimateEquipmentValue(killer.Equipment || {}),
                estimateEquipmentValue(victim.Equipment || {}),
            ]);

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
                    {
                        name: "💸 Estimation équipement",
                        value: `Tueur : ${killerValue.toLocaleString()} 🪙\nVictime : ${victimValue.toLocaleString()} 🪙`,
                        inline: false,
                    },
                )
                .setFooter({ text: `Combat #${index + 1}` })
                .setTimestamp();

            await i.reply({ embeds: [detailEmbed], flags: ['Ephemeral'] });
        } catch (err) {
            logger.error(`❌ Erreur lors de l'affichage des détails`, { 
                command: 'playerhistory',
                buttonId: i.customId,
                error: err
            });
            await i.reply({ 
                content: "❌ Une erreur est survenue lors de la récupération des détails.", 
                flags: ['Ephemeral'] 
            });
        }
    });

    collector.on("end", () => {
        message.edit({ components: [] }).catch((err) => {
            logger.warn(`⚠️ Impossible de supprimer les boutons`, { 
                command: 'playerhistory',
                error: err
            });
        });
    });
}

// Wrap the command execution with error handling
export const execute = withErrorHandling(executeCommand, "playerhistory");
