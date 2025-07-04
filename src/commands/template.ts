import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  AttachmentBuilder,
} from "discord.js";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SLOT_COORDS = {
  Head: [185, 138],
  Armor: [185, 250],
  Shoes: [185, 365],
  MainHand: [57, 250],
  OffHand: [314, 250],
  Bag: [32, 127],
  Cape: [340, 127],
  Mount: [185, 475],
  Potion: [340, 377],
  Food: [32, 377],
};

const SLOT_COORDS_RIGHT = {
  Head: [905, 138],
  Armor: [905, 250],
  Shoes: [905, 365],
  MainHand: [778, 250],
  OffHand: [1034, 250],
  Bag: [752, 127],
  Cape: [1060, 127],
  Mount: [905, 475],
  Potion: [1060, 377],
  Food: [752, 377],
};

export const data = new SlashCommandBuilder()
  .setName("template")
  .setDescription("Génère une image avec les équipements du dernier kill");

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    await interaction.deferReply();

    const bgPath = path.join(__dirname, "..", "assets", "template.png");
    const bg = await loadImage(bgPath);
    const canvas = createCanvas(1200, 610);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bg, 0, 0, 1200, 610);

    const killData = (await (
      await fetch(
        "https://gameinfo-ams.albiononline.com/api/gameinfo/players/tO9kB-LWRpmdszaTISBaVw/kills",
      )
    ).json()) as any[];

    const kill = killData[0];
    const killerEquip = kill.Killer.Equipment;
    const victimEquip = kill.Victim.Equipment;

    async function drawEquip(equipment: any, coords: Record<string, number[]>) {
      for (const [slot, [x, y]] of Object.entries(coords)) {
        const item = equipment[slot];
        if (!item?.Type) continue;

        const type = item.Type;
        const quality = item.Quality ?? 1;
        const imgUrl = `https://render.albiononline.com/v1/item/${type}.png?quality=${quality}`;

        try {
          const img = await loadImage(imgUrl);
          ctx.drawImage(img, x, y, 106, 106);
        } catch (err) {
          console.warn(`❌ Échec chargement image : ${imgUrl}`);
        }
      }
    }

    function drawCenteredPlayerHeader(
      player: any,
      xStart: number,
      xEnd: number,
    ) {
      ctx.textAlign = "center";
      ctx.fillStyle = "black";

      const centerX = xStart + (xEnd - xStart) / 2;
      let y = 50;

      // Pseudo
      ctx.font = "bold 26px Georgia";
      ctx.fillText(player.Name, centerX, y);

      // Alliance + Guilde (sur la même ligne)
      const allianceTag = player.AllianceName ? `[${player.AllianceName}]` : "";
      const guildName = player.GuildName ?? "";
      const fullLine = `${allianceTag} ${guildName}`.trim();

      if (fullLine) {
        y += 30;
        ctx.font = "20px Georgia";
        ctx.fillText(fullLine, centerX, y);
      }
    }

    async function drawSilverIcons(ctx: CanvasRenderingContext2D) {
      const iconPath = path.join(__dirname, "..", "assets", "silver.png");
      const icon = await loadImage(iconPath);

      const positions = [
        [579, 237],
        [619, 277],
      ];

      for (const [x, y] of positions) {
        ctx.drawImage(icon as unknown as CanvasImageSource, x, y, 32, 32);
      }
    }

    // Équipements
    await drawEquip(killerEquip, SLOT_COORDS); // Gauche
    await drawEquip(victimEquip, SLOT_COORDS_RIGHT); // Droite

    // Infos en haut
    drawCenteredPlayerHeader(kill.Killer, 32, 445);
    drawCenteredPlayerHeader(kill.Victim, 752, 1164);

    await drawSilverIcons(ctx);

    // 🔏 Watermark centré
    ctx.save();
    ctx.globalAlpha = 0.8; // Opacité légère
    ctx.textAlign = "center";
    ctx.fillStyle = "rgb(151,121,97)";
    ctx.font = "bold 28px Impact, Georgia, serif"; // Impact si dispo, sinon Georgia
    ctx.fillText("Captain Flynn Swift", canvas.width / 2, 50);
    ctx.restore();

    const buffer = canvas.toBuffer("image/png");
    const attachment = new AttachmentBuilder(buffer, {
      name: "kill_template.png",
    });

    await interaction.editReply({
      content: "Voici l’image générée avec les équipements :",
      files: [attachment],
    });
  } catch (error) {
    console.error("Erreur dans /template :", error);
    await interaction.editReply({
      content: "❌ Une erreur est survenue.",
    });
  }
}
