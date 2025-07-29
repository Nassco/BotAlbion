import db from "../db.js";
import fetch from "node-fetch";

export async function registerPlayer(
  name: string,
  guildId: string,
): Promise<{ success: boolean; message: string }> {
  try {
    // Vérifie si déjà enregistré dans cette guilde
    const existing = db
      .prepare("SELECT * FROM players WHERE name = ? AND guildId = ?")
      .get(name, guildId);
    if (existing) {
      return {
        success: false,
        message: `❌ Le joueur **${name}** est déjà enregistré pour cette guilde.`,
      };
    }

    // Récupère l'ID Albion
    const res = await fetch(
      `https://gameinfo-ams.albiononline.com/api/gameinfo/search?q=${encodeURIComponent(name)}`,
    );
    const data = (await res.json()) as {
      players?: { Name: string; Id: string }[];
    };
    const playerEntry = data.players?.find(
      (p) => p.Name.toLowerCase() === name.toLowerCase(),
    );

    if (!playerEntry) {
      return {
        success: false,
        message: `❌ Le joueur **${name}** est introuvable sur l’API.`,
      };
    }

    const idAO = playerEntry.Id;

    db.prepare(
      `
      INSERT INTO players (name, idAO, guildId, lastKill, lastDeath)
      VALUES (?, ?, ?, NULL, NULL)
    `,
    ).run(name, idAO, guildId);

    return {
      success: true,
      message: `✅ Le joueur **${name}** a été enregistré avec succès.`,
    };
  } catch (err) {
    console.error("Erreur lors de l'enregistrement :", err);
    return {
      success: false,
      message: "❌ Une erreur est survenue pendant l'enregistrement.",
    };
  }
}
