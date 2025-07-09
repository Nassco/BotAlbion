import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PLAYERS_FILE = path.join(__dirname, "..", "data", "players.json");

export interface RegisteredPlayer {
  name: string;
  id: string;
  registeredAt: string;
  lastKill: string | null;
  lastDeath: string | null;
}

/**
 * Récupère l'ID d'un joueur Albion Online via l'API officielle (serveur AMS)
 */
async function getPlayerId(pseudo: string): Promise<string | null> {
  try {
    const url = `https://gameinfo-ams.albiononline.com/api/gameinfo/search?q=${encodeURIComponent(
      pseudo,
    )}`;
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

/**
 * Enregistre un joueur dans le fichier players.json avec son ID et des métadonnées.
 */
export async function registerPlayer(
  pseudo: string,
): Promise<{ success: boolean; message: string }> {
  let players: RegisteredPlayer[] = [];

  // Chargement existant
  if (fs.existsSync(PLAYERS_FILE)) {
    try {
      players = JSON.parse(fs.readFileSync(PLAYERS_FILE, "utf8"));
    } catch (err) {
      console.error("❌ Erreur lecture players.json :", err);
      return {
        success: false,
        message: "❌ Erreur lors de la lecture des joueurs.",
      };
    }
  }

  // Déjà enregistré ?
  const alreadyExists = players.some(
    (p) => p.name.toLowerCase() === pseudo.toLowerCase(),
  );
  if (alreadyExists) {
    return {
      success: false,
      message: `⚠️ Joueur **${pseudo}** est déjà enregistré.`,
    };
  }

  // Récupération ID Albion
  const id = await getPlayerId(pseudo);
  if (!id) {
    return {
      success: false,
      message: `❌ Joueur **${pseudo}** introuvable sur l'API Albion.`,
    };
  }

  // Ajout
  const newPlayer: RegisteredPlayer = {
    name: pseudo,
    id,
    registeredAt: new Date().toISOString(),
    lastKill: null,
    lastDeath: null,
  };

  players.push(newPlayer);

  try {
    fs.writeFileSync(PLAYERS_FILE, JSON.stringify(players, null, 2));
    return {
      success: true,
      message: `✅ Joueur **${pseudo}** enregistré avec succès !`,
    };
  } catch (err) {
    console.error("❌ Erreur écriture players.json :", err);
    return {
      success: false,
      message: "❌ Échec lors de l'enregistrement du joueur.",
    };
  }
}
