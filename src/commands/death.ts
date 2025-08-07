import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  AttachmentBuilder,
} from "discord.js";
import { createCanvas, loadImage, registerFont } from "canvas";
import path from "path";
import { fileURLToPath } from "url";
import { getPlayerDeaths, estimateEquipmentValue } from "../services/albionApi.js";
import { ALBION_AVATAR_URL } from "../constants.js";
import { findPlayer } from "../utils/playerUtils.js";
import { HistoryEntry, CombatParticipant } from "../interfaces/AlbionApiTypes.js";
import logger from "../utils/logger.js";
import { withErrorHandling, createError, ErrorType } from "../utils/errorHandler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SLOT_COORDS = {
  Head: [178, 129],
  Armor: [178, 241],
  Shoes: [178, 356],
  MainHand: [50, 241],
  OffHand: [307, 241],
  Bag: [25, 118],
  Cape: [333, 118],
  Mount: [178, 466],
  Potion: [333, 368],
  Food: [25, 368],
};

const SLOT_COORDS_RIGHT = {
  Head: [898, 129],
  Armor: [898, 241],
  Shoes: [898, 356],
  MainHand: [771, 241],
  OffHand: [1027, 241],
  Bag: [745, 118],
  Cape: [1053, 118],
  Mount: [898, 466],
  Potion: [1053, 368],
  Food: [745, 368],
};

// Enregistre Orbitron-Medium dans le canvas
registerFont(path.join(__dirname, "../assets/fonts/Orbitron-Medium.ttf"), {
  family: "Orbitron",
});

export const data = new SlashCommandBuilder()
  .setName("death")
  .setDescription("Affiche la dernière mort d’un joueur Albion Online")
  .addStringOption((option) =>
    option.setName("pseudo").setDescription("Nom du joueur").setRequired(true),
  );

// Helper functions for drawing
async function drawEquip(ctx: any, equipment: Record<string, any>, coords: Record<string, number[]>) {
  for (const [slot, [x, y]] of Object.entries(coords)) {
    const item = equipment[slot];
    if (!item?.Type) continue;

    const type = item.Type;
    const quality = item.Quality ?? 1;
    const imgUrl = `${ALBION_AVATAR_URL.replace('/avatar', '/item')}/${type}.png?quality=${quality}`;

    try {
      const img = await loadImage(imgUrl);
      ctx.drawImage(img, x, y, 125, 129);
    } catch (err) {
      logger.warn(`❌ Erreur chargement image : ${imgUrl}`, { itemType: type, quality, error: err });
    }
  }
}

function drawCenteredPlayerHeader(ctx: any, player: CombatParticipant, xStart: number, xEnd: number) {
  ctx.textAlign = "center";
  ctx.fillStyle = "black";

  const centerX = xStart + (xEnd - xStart) / 2;
  let y = 50;

  ctx.font = "bold 26px Uncial Antiqua";
  ctx.fillText(player.Name, centerX, y);

  const allianceTag = player.AllianceName ? `[${player.AllianceName}]` : "";
  const guildName = player.GuildName ?? "";
  const fullLine = `${allianceTag} ${guildName}`.trim();

  if (fullLine) {
    y += 30;
    ctx.font = "20px Uncial Antiqua";
    ctx.fillText(fullLine, centerX, y);
  }
}

function drawCenteredText(ctx: any, text: string, x: number, y: number, width: number, font: string) {
  ctx.textAlign = "center";
  ctx.fillStyle = "black";
  ctx.font = font;
  ctx.fillText(text, x + width / 2, y);
}

// Main command execution function
async function executeCommand(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const pseudo = interaction.options.getString("pseudo", true);
  logger.info(`🔍 /death ${pseudo}`, { command: 'death', pseudo });

  // Use the shared findPlayer utility
  const player = await findPlayer(interaction, pseudo);
  if (!player) {
    // findPlayer already replied with an error message
    return;
  }
  
  const playerId = player.Id;

  logger.info(`📥 Récupération des morts pour ${playerId}`, { command: 'death', playerId });
  const deaths = await getPlayerDeaths(playerId);

  if (!Array.isArray(deaths) || deaths.length === 0) {
    logger.warn(`❌ Aucune mort trouvée pour "${pseudo}"`, { command: 'death', pseudo });
    throw createError(`No deaths found for player: ${pseudo}`, ErrorType.NOT_FOUND_ERROR);
  }

  const death = deaths[0];
  const victimEquip = death.Victim.Equipment || {};
  const killerEquip = death.Killer.Equipment || {};

  const bgPath = path.join(__dirname, "..", "assets", "template.png");
  const bg = await loadImage(bgPath);
  const canvas = createCanvas(1200, 610);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bg, 0, 0, 1200, 610);

  // Dessin des équipements
  await drawEquip(ctx, killerEquip, SLOT_COORDS);
  await drawEquip(ctx, victimEquip, SLOT_COORDS_RIGHT);

  // Infos joueur
  drawCenteredPlayerHeader(ctx, death.Killer, 32, 445);
  drawCenteredPlayerHeader(ctx, death.Victim, 752, 1164);

  // Kill Fame
  const killFame = death.TotalVictimKillFame.toLocaleString("en-US");
  drawCenteredText(ctx, `${killFame}`, 480, 180, 240, "bold 26px Orbitron");

  // Estimation valeur équipement + inventaire victime
  const combinedItems = {
    ...victimEquip,
    ...death.Victim.Inventory?.reduce(
      (acc: Record<string, { Type: string; Quality: number }>, item, index: number) => {
        if (item?.Type) acc[`InventorySlot${index}`] = item;
        return acc;
      },
      {},
    ),
  };

  const estimatedValue = await estimateEquipmentValue(combinedItems);
  const formattedValue = estimatedValue.toLocaleString("en-US", {
    maximumFractionDigits: 0,
  });
  drawCenteredText(ctx, `${formattedValue}`, 480, 310, 240, "bold 26px Orbitron");

  // Date
  const killDate = new Date(death.TimeStamp);
  const formattedDate = killDate.toLocaleDateString("fr-FR");
  const formattedTime = killDate.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  drawCenteredText(
    ctx,
    `${formattedDate} ${formattedTime}`,
    480,
    480,
    240,
    "bold 22px Orbitron",
  );

  const buffer = canvas.toBuffer("image/png");
  const attachment = new AttachmentBuilder(buffer, {
    name: "death_template.png",
  });

  await interaction.editReply({
    embeds: [
      {
        title: `Dernière mort de ${pseudo}`,
        color: 0xff0000, // Rouge
        image: {
          url: "attachment://death_template.png",
        },
      },
    ],
    files: [attachment],
  });
}

// Wrap the command execution with error handling
export const execute = withErrorHandling(executeCommand, "death");

