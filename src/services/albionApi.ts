import { ALBION_API_BASE_URL, ALBION_PRICE_API_URL, API_REQUEST_TIMEOUT } from "../constants.js";
import { PlayerInfo } from "../interfaces/PlayerInfo.js";
import { PlayerSearchResult, HistoryEntry, PriceEntry } from "../interfaces/AlbionApiTypes.js";
import logger from "../utils/logger.js";

/**
 * Fonction générique pour effectuer des requêtes API avec gestion du timeout
 * 
 * @template T - Type de retour de la requête API
 * @param url - URL complète de la requête
 * @param logMetadata - Métadonnées pour le logging
 * @returns Données de l'API typées
 * @throws Error si la requête échoue ou timeout
 */
async function makeApiRequest<T>(url: string, logMetadata: Record<string, any>): Promise<T> {
  logger.http(`📡 GET ${url}`, logMetadata);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_REQUEST_TIMEOUT);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    return await response.json() as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      logger.error(`⏱️ Request timeout for ${url}`, { ...logMetadata, timeout: API_REQUEST_TIMEOUT });
      throw new Error(`Request timeout after ${API_REQUEST_TIMEOUT}ms`);
    }
    logger.error(`❌ API request failed for ${url}`, { ...logMetadata, error });
    throw error;
  }
}

/**
 * Recherche des joueurs par nom
 * 
 * @param name - Nom du joueur à rechercher
 * @returns Résultats de la recherche
 */
export async function searchPlayer(name: string): Promise<PlayerSearchResult> {
  const url = `${ALBION_API_BASE_URL}/search?q=${encodeURIComponent(name)}`;
  return makeApiRequest<PlayerSearchResult>(url, { endpoint: 'search', player: name });
}

/**
 * Récupère les détails d'un joueur par son ID
 * 
 * @param playerId - ID du joueur Albion Online
 * @returns Informations détaillées du joueur
 */
export async function getPlayerInfo(playerId: string): Promise<PlayerInfo> {
  const url = `${ALBION_API_BASE_URL}/players/${playerId}`;
  return makeApiRequest<PlayerInfo>(url, { endpoint: 'players', playerId });
}

/**
 * Récupère l'historique des kills d'un joueur
 * 
 * @param playerId - ID du joueur Albion Online
 * @returns Liste des événements de kill
 */
export async function getPlayerKills(playerId: string): Promise<HistoryEntry[]> {
  const url = `${ALBION_API_BASE_URL}/players/${playerId}/kills`;
  return makeApiRequest<HistoryEntry[]>(url, { endpoint: 'kills', playerId });
}

/**
 * Récupère l'historique des morts d'un joueur
 * 
 * @param playerId - ID du joueur Albion Online
 * @returns Liste des événements de mort
 */
export async function getPlayerDeaths(playerId: string): Promise<HistoryEntry[]> {
  const url = `${ALBION_API_BASE_URL}/players/${playerId}/deaths`;
  return makeApiRequest<HistoryEntry[]>(url, { endpoint: 'deaths', playerId });
}

/**
 * Récupère l'historique d'un joueur (kills ou morts)
 * 
 * @param playerId - ID du joueur Albion Online
 * @param type - Type d'historique ("kills" ou "deaths")
 * @returns Liste des événements d'historique
 */
export async function getPlayerHistory(playerId: string, type: "kills" | "deaths"): Promise<HistoryEntry[]> {
  const url = `${ALBION_API_BASE_URL}/players/${playerId}/${type}`;
  return makeApiRequest<HistoryEntry[]>(url, { endpoint: type, playerId });
}

/**
 * Estime la valeur des équipements d'un joueur
 * 
 * @param equipment - Objets d'équipement du joueur
 * @returns Valeur estimée en argent (silver)
 */
export async function estimateEquipmentValue(
  equipment: Record<string, { Type: string; Quality: number } | null | undefined>,
): Promise<number> {
  const items = Object.values(equipment || {}).filter(Boolean) as { Type: string; Quality: number }[];
  const totalItems: number = items.length;
  if (totalItems === 0) return 0;

  const excludedLocation = "Black Market";

  // Créer des promesses pour chaque item
  const pricePromises = items.map(async (item) => {
    const itemId = item.Type;
    const quality = item.Quality;

    if (!itemId) return 0;

    try {
      const priceUrl = `${ALBION_PRICE_API_URL}/prices/${itemId}.json?qualities=${quality}`;
      const data = await makeApiRequest<any[]>(priceUrl, { endpoint: 'prices', itemId, quality });

      if (Array.isArray(data)) {
        const validPrices = data.filter(
          (entry: PriceEntry) =>
            entry.sell_price_min > 0 &&
            entry.city !== excludedLocation,
        );

        if (validPrices.length > 0) {
          return validPrices.reduce(
            (sum, entry) => sum + entry.sell_price_min,
            0,
          ) / validPrices.length;
        }
      }
      return 0;
    } catch (err) {
      logger.warn(`⚠️ Erreur récupération prix pour ${itemId}`, { itemId, quality, error: err });
      return 0;
    }
  });

  // Exécuter toutes les promesses en parallèle et additionner les résultats
  const prices = await Promise.all(pricePromises);
  return prices.reduce((total, price) => total + price, 0);
}