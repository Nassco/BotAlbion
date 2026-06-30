import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder,
} from "discord.js";
import logger from "../utils/logger.js";
import { withErrorHandling } from "../utils/errorHandler.js";
import { GTNH_ORE_VEINS, GtnhDimension, GtnhOreVein } from "../data/gtnhOreVeins.js";

interface VeinCenter {
    x: number;
    z: number;
    distance: number;
}

/**
 * Retourne les N centres de sections (potentiels centres de veines) les plus proches.
 *
 * Dans GTNH, les veines d'ore occupent une zone de 3x3 chunks. Chaque section 3x3
 * a son centre au chunk (3n+1, 3m+1) pour n,m entiers. Ce centre est l'endroit
 * le plus dense en minerai si une veine est générée dans cette section.
 */
function findNearbyVeinCenters(
    chunkX: number,
    chunkZ: number,
    radiusChunks: number,
    maxResults: number
): VeinCenter[] {
    const minSX = Math.floor((chunkX - radiusChunks) / 3);
    const maxSX = Math.ceil((chunkX + radiusChunks) / 3);
    const minSZ = Math.floor((chunkZ - radiusChunks) / 3);
    const maxSZ = Math.ceil((chunkZ + radiusChunks) / 3);

    const centers: VeinCenter[] = [];
    for (let sn = minSX; sn <= maxSX; sn++) {
        for (let sm = minSZ; sm <= maxSZ; sm++) {
            const vcX = sn * 3 + 1;
            const vcZ = sm * 3 + 1;
            const distance = Math.sqrt((vcX - chunkX) ** 2 + (vcZ - chunkZ) ** 2);
            if (distance <= radiusChunks) {
                centers.push({ x: vcX, z: vcZ, distance });
            }
        }
    }

    centers.sort((a, b) => a.distance - b.distance);
    return centers.slice(0, maxResults);
}

/**
 * Formate la liste des centres de veines pour l'embed Discord.
 */
function formatCentersList(
    centers: VeinCenter[],
    currentCenterX: number,
    currentCenterZ: number
): string {
    return centers.map((c, i) => {
        const blockX = c.x * 16;
        const blockZ = c.z * 16;
        const isCurrent = c.x === currentCenterX && c.z === currentCenterZ;
        const rank = isCurrent ? "⭐" : `**${i + 1}.**`;
        const distLabel = isCurrent
            ? "← section actuelle"
            : `${c.distance.toFixed(1)} chunk${c.distance > 1 ? "s" : ""}`;
        return `${rank} Chunk \`(${c.x}, ${c.z})\` → Bloc \`(${blockX}, ${blockZ})\` — ${distLabel}`;
    }).join("\n");
}

/**
 * Formate la liste des types de veines pour un champ de l'embed.
 * Tronque si nécessaire pour respecter la limite de 1024 caractères de Discord.
 */
function formatOreList(veins: GtnhOreVein[]): string {
    const lines: string[] = [];
    let totalLen = 0;
    for (const v of veins) {
        const line = `• **${v.name}** (Y ${v.minY}–${v.maxY}): ${v.ores.join(", ")}`;
        if (totalLen + line.length + 1 > 1000) {
            lines.push(`*…et ${veins.length - lines.length} autre(s)*`);
            break;
        }
        lines.push(line);
        totalLen += line.length + 1;
    }
    return lines.join("\n") || "Aucune veine connue pour cette dimension.";
}

export const data = new SlashCommandBuilder()
    .setName("gtnh-nearest-vein")
    .setDescription("GTNH — Trouve les chunks centres de veines d'ore les plus proches")
    .addIntegerOption(option =>
        option
            .setName("chunk_x")
            .setDescription("Coordonnée X du chunk actuel (= bloc X ÷ 16)")
            .setRequired(true)
    )
    .addIntegerOption(option =>
        option
            .setName("chunk_z")
            .setDescription("Coordonnée Z du chunk actuel (= bloc Z ÷ 16)")
            .setRequired(true)
    )
    .addStringOption(option =>
        option
            .setName("dimension")
            .setDescription("Dimension de recherche (défaut : overworld)")
            .setRequired(false)
            .addChoices(
                { name: "Overworld", value: "overworld" },
                { name: "Nether",    value: "nether"    },
                { name: "End",       value: "end"        },
            )
    )
    .addIntegerOption(option =>
        option
            .setName("rayon")
            .setDescription("Rayon de recherche en chunks (défaut : 32, max : 96)")
            .setRequired(false)
            .setMinValue(3)
            .setMaxValue(96)
    );

async function executeCommand(interaction: ChatInputCommandInteraction) {
    const chunkX     = interaction.options.getInteger("chunk_x", true);
    const chunkZ     = interaction.options.getInteger("chunk_z", true);
    const dimension  = (interaction.options.getString("dimension") ?? "overworld") as GtnhDimension;
    const radius     = interaction.options.getInteger("rayon") ?? 32;

    logger.info(`🔍 /gtnh-nearest-vein`, {
        command: "gtnh-nearest-vein",
        chunkX, chunkZ, dimension, radius,
        user: interaction.user.tag,
    });

    await interaction.deferReply();

    // Centre de la section 3x3 contenant le chunk courant
    const currentCenterX = Math.floor(chunkX / 3) * 3 + 1;
    const currentCenterZ = Math.floor(chunkZ / 3) * 3 + 1;

    const centers = findNearbyVeinCenters(chunkX, chunkZ, radius, 10);
    const dimensionVeins = GTNH_ORE_VEINS.filter(v => v.dimension === dimension);

    const centersList = formatCentersList(centers, currentCenterX, currentCenterZ);
    const oreList     = formatOreList(dimensionVeins);

    const dimensionLabel: Record<GtnhDimension, string> = {
        overworld: "Overworld 🌿",
        nether:    "Nether 🔥",
        end:       "End 🌌",
    };

    const embed = new EmbedBuilder()
        .setTitle(`⛏️ Veines d'ore GTNH — ${dimensionLabel[dimension]}`)
        .setDescription(
            `**Position actuelle :** Chunk \`(${chunkX}, ${chunkZ})\` → Bloc \`(${chunkX * 16}, ${chunkZ * 16})\`\n` +
            `**Centre de ta section :** Chunk \`(${currentCenterX}, ${currentCenterZ})\` → Bloc \`(${currentCenterX * 16}, ${currentCenterZ * 16})\`\n\n` +
            `**🎯 Centres de veines potentielles** (rayon : ${radius} chunks) :\n` +
            centersList
        )
        .addFields({
            name: `📋 Veines possibles — ${dimensionLabel[dimension]}`,
            value: oreList,
        })
        .setFooter({
            text: "Centres potentiels uniquement — la présence d'une veine dépend du seed du monde. F3 → \"Chunk: x y z\" pour tes coords chunk.",
        })
        .setColor(0xe67e22);

    await interaction.editReply({ embeds: [embed] });

    logger.info(`✅ gtnh-nearest-vein : ${centers.length} centres trouvés`, {
        command: "gtnh-nearest-vein",
        chunkX, chunkZ, dimension, radius,
        nearest: centers[0],
    });
}

export const execute = withErrorHandling(executeCommand, "gtnh-nearest-vein");
