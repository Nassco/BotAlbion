import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  AttachmentBuilder,
} from "discord.js";
import { createCanvas, loadImage, registerFont } from "canvas";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";

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
          ctx.drawImage(img, x, y, 125, 129);
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
      ctx.font = "bold 26px Uncial Antiqua";
      ctx.fillText(player.Name, centerX, y);

      // Alliance + Guilde (sur la même ligne)
      const allianceTag = player.AllianceName ? `[${player.AllianceName}]` : "";
      const guildName = player.GuildName ?? "";
      const fullLine = `${allianceTag} ${guildName}`.trim();

      if (fullLine) {
        y += 30;
        ctx.font = "20px Uncial Antiqua";
        ctx.fillText(fullLine, centerX, y);
      }
    }

    function drawCenteredText(
      text: string,
      x: number,
      y: number,
      width: number,
      font: string,
    ) {
      ctx.textAlign = "center";
      ctx.fillStyle = "black";
      ctx.font = font;

      const centerX = x + width / 2;
      ctx.fillText(text, centerX, y);
    }

    async function estimateEquipmentValue(
      equipment: Record<string, any>,
    ): Promise<number> {
      let total = 0;
      const excludedLocation = "Black Market";

      const items = Object.values(equipment || {}).filter(Boolean);
      for (const item of items) {
        const itemId = item.Type;
        const quality = item.Quality;

        if (!itemId) continue;

        try {
          const url = `https://west.albion-online-data.com/api/v2/stats/prices/${itemId}.json?qualities=${quality}`;
          const res = await fetch(url);
          const data = await res.json();

          if (Array.isArray(data)) {
            const valid = data.filter(
              (e: any) => e.sell_price_min > 0 && e.city !== excludedLocation,
            );
            if (valid.length > 0) {
              const avg =
                valid.reduce((sum, e) => sum + e.sell_price_min, 0) /
                valid.length;
              total += avg;
            }
          }
        } catch (err) {
          console.warn(`⚠️ Erreur prix pour ${itemId}`, err);
        }
      }

      return total;
    }

    // Équipements
    await drawEquip(killerEquip, SLOT_COORDS);
    await drawEquip(victimEquip, SLOT_COORDS_RIGHT);

    // Infos joueur
    drawCenteredPlayerHeader(kill.Killer, 32, 445);
    drawCenteredPlayerHeader(kill.Victim, 752, 1164);

    // Kill Fame
    const killFame = kill.TotalVictimKillFame.toLocaleString("en-US");
    drawCenteredText(`${killFame}`, 480, 180, 240, "bold 26px Orbitron");

    // Estimation équipement
    const combinedItems = {
      ...victimEquip,
      ...kill.Victim.Inventory?.reduce((acc: any, item: any, index: number) => {
        if (item?.Type) acc[`InventorySlot${index}`] = item;
        return acc;
      }, {}),
    };

    const estimatedValue = await estimateEquipmentValue(combinedItems);
    const formattedValue = estimatedValue.toLocaleString("en-US", {
      maximumFractionDigits: 0,
    });
    drawCenteredText(`${formattedValue}`, 480, 310, 240, "bold 26px Orbitron");

    // Date
    // Date et heure du kill
    const killDate = new Date(kill.TimeStamp);
    const formattedDate = killDate.toLocaleDateString("fr-FR");
    const formattedTime = killDate.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    drawCenteredText(
      `${formattedDate} ${formattedTime}`,
      480,
      480,
      240,
      "bold 22px Orbitron",
    );

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
