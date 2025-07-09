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

export const data = new SlashCommandBuilder()
  .setName("kill")
  .setDescription("Affiche le dernier kill d’un joueur Albion Online")
  .addStringOption((option) =>
    option.setName("pseudo").setDescription("Nom du joueur").setRequired(true),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    await interaction.deferReply();

    const pseudo = interaction.options.getString("pseudo", true);
    console.log(`🔍 Requête : recherche du joueur "${pseudo}"`);

    const playerId = await getPlayerId(pseudo);

    if (!playerId) {
      console.warn(`❌ Aucun ID trouvé pour "${pseudo}"`);
      await interaction.editReply(`❌ Joueur **${pseudo}** introuvable.`);
      return;
    }

    const killsUrl = `https://gameinfo-ams.albiononline.com/api/gameinfo/players/${playerId}/kills`;
    console.log(`📥 Requête : récupération des kills -> ${killsUrl}`);

    const kills = await fetch(killsUrl).then((res) => res.json());

    if (!Array.isArray(kills) || kills.length === 0) {
      console.warn(`❌ Aucun kill trouvé pour "${pseudo}"`);
      await interaction.editReply(`❌ Aucun kill trouvé pour **${pseudo}**.`);
      return;
    }

    const kill = kills[0];
    const killerEquip = kill.Killer.Equipment;
    const victimEquip = kill.Victim.Equipment;

    const bgPath = path.join(__dirname, "..", "assets", "template.png");
    const bg = await loadImage(bgPath);
    const canvas = createCanvas(1200, 610);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bg, 0, 0, 1200, 610);

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
          console.warn(`❌ Erreur chargement image : ${imgUrl}`);
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
      ctx.fillText(text, x + width / 2, y);
    }

    async function estimateEquipmentValue(
      equipment: Record<string, any>,
    ): Promise<number> {
      let total = 0;
      const excludedLocation = "Black Market";
      const items = Object.values(equipment || {}).filter(Boolean);

      let countedItems = 0;

      for (const item of items) {
        const itemId = item.Type;
        const quality = item.Quality;

        if (!itemId) continue;

        try {
          const url = `https://west.albion-online-data.com/api/v2/stats/prices/${itemId}.json?qualities=${quality}`;
          console.log(`📦 Requête prix : ${url}`);
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
              console.log(
                `📊 ${itemId} (qualité ${quality}): ${valid.length} entrées valides, moyenne = ${Math.round(avg)}`,
              );
              total += avg;
              countedItems++;
            } else {
              console.log(
                `⚠️ ${itemId} (qualité ${quality}) : aucun prix valide trouvé`,
              );
            }
          } else {
            console.warn(`❌ Format inattendu pour les prix de ${itemId}`);
          }
        } catch (err) {
          console.warn(`⚠️ Erreur prix pour ${itemId}`, err);
        }
      }

      console.log(
        `💰 Total estimé pour ${countedItems} items : ${Math.round(total)}`,
      );

      return total;
    }

    // Dessin des équipements
    await drawEquip(killerEquip, SLOT_COORDS);
    await drawEquip(victimEquip, SLOT_COORDS_RIGHT);

    // Infos joueur
    drawCenteredPlayerHeader(kill.Killer, 32, 445);
    drawCenteredPlayerHeader(kill.Victim, 752, 1164);

    // Kill Fame
    const killFame = kill.TotalVictimKillFame.toLocaleString("en-US");
    drawCenteredText(`${killFame}`, 480, 180, 240, "bold 26px Arial");

    // Estimation valeur équipement + inventaire victime
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
    drawCenteredText(`${formattedValue}`, 480, 310, 240, "bold 26px Arial");

    // Date
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
      "bold 22px Arial",
    );

    const buffer = canvas.toBuffer("image/png");
    const attachment = new AttachmentBuilder(buffer, {
      name: "kill_template.png",
    });

    await interaction.editReply({
      embeds: [
        {
          title: `Dernier kill de ${pseudo}`,
          color: 0x00ff00, // Vert
          image: {
            url: "attachment://kill_template.png",
          },
        },
      ],
      files: [attachment],
    });
  } catch (err) {
    console.error("Erreur dans /kill :", err);
    await interaction.editReply({
      content: "❌ Une erreur est survenue pendant la génération.",
    });
  }
}

async function getPlayerId(pseudo: string): Promise<string | null> {
  try {
    const url = `https://gameinfo-ams.albiononline.com/api/gameinfo/search?q=${encodeURIComponent(pseudo)}`;
    console.log(`🔍 Requête API recherche : ${url}`);
    const res = await fetch(url);
    const data: any = await res.json();
    const player = data.players?.find(
      (p: any) => p.Name.toLowerCase() === pseudo.toLowerCase(),
    );
    return player?.Id ?? null;
  } catch (err) {
    console.error("❌ Erreur API getPlayerId :", err);
    return null;
  }
}
