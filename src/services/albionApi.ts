import { ALBION_API_BASE_URL, ALBION_PRICE_API_URL, API_REQUEST_TIMEOUT } from "../constants.js";
import { PlayerInfo } from "../interfaces/PlayerInfo.js";
import { PlayerSearchResult, HistoryEntry, PriceEntry } from "../interfaces/AlbionApiTypes.js";
import logger from "../utils/logger.js";

/**
 * Search for players by name
 * @param name Player name to search for
 * @returns Search results
 */
export async function searchPlayer(name: string): Promise<PlayerSearchResult> {
  const url = `${ALBION_API_BASE_URL}/search?q=${encodeURIComponent(name)}`;
  logger.http(`📡 GET ${url}`, { endpoint: 'search', player: name });
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_REQUEST_TIMEOUT);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return await response.json() as PlayerSearchResult;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      logger.error(`⏱️ Request timeout for ${url}`, { endpoint: 'search', timeout: API_REQUEST_TIMEOUT });
      throw new Error(`Request timeout after ${API_REQUEST_TIMEOUT}ms`);
    }
    throw error;
  }
}

/**
 * Get player details by ID
 * @param playerId Albion Online player ID
 * @returns Player information
 */
export async function getPlayerInfo(playerId: string): Promise<PlayerInfo> {
  const url = `${ALBION_API_BASE_URL}/players/${playerId}`;
  logger.http(`📡 GET ${url}`, { endpoint: 'players', playerId });
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_REQUEST_TIMEOUT);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return await response.json() as PlayerInfo;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      logger.error(`⏱️ Request timeout for ${url}`, { endpoint: 'players', playerId, timeout: API_REQUEST_TIMEOUT });
      throw new Error(`Request timeout after ${API_REQUEST_TIMEOUT}ms`);
    }
    throw error;
  }
}

/**
 * Get player kills history
 * @param playerId Albion Online player ID
 * @returns Kill events
 */
export async function getPlayerKills(playerId: string): Promise<HistoryEntry[]> {
  const url = `${ALBION_API_BASE_URL}/players/${playerId}/kills`;
  logger.http(`📡 GET ${url}`, { endpoint: 'kills', playerId });
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_REQUEST_TIMEOUT);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return await response.json() as HistoryEntry[];
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      logger.error(`⏱️ Request timeout for ${url}`, { endpoint: 'kills', playerId, timeout: API_REQUEST_TIMEOUT });
      throw new Error(`Request timeout after ${API_REQUEST_TIMEOUT}ms`);
    }
    throw error;
  }
}

/**
 * Get player deaths history
 * @param playerId Albion Online player ID
 * @returns Death events
 */
export async function getPlayerDeaths(playerId: string): Promise<HistoryEntry[]> {
  const url = `${ALBION_API_BASE_URL}/players/${playerId}/deaths`;
  logger.http(`📡 GET ${url}`, { endpoint: 'deaths', playerId });
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_REQUEST_TIMEOUT);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return await response.json() as HistoryEntry[];
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      logger.error(`⏱️ Request timeout for ${url}`, { endpoint: 'deaths', playerId, timeout: API_REQUEST_TIMEOUT });
      throw new Error(`Request timeout after ${API_REQUEST_TIMEOUT}ms`);
    }
    throw error;
  }
}

/**
 * Get player history (kills or deaths)
 * @param playerId Albion Online player ID
 * @param type Type of history (kills or deaths)
 * @returns History events
 */
export async function getPlayerHistory(playerId: string, type: "kills" | "deaths"): Promise<HistoryEntry[]> {
  const url = `${ALBION_API_BASE_URL}/players/${playerId}/${type}`;
  logger.http(`📡 GET ${url}`, { endpoint: type, playerId });
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_REQUEST_TIMEOUT);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return await response.json() as HistoryEntry[];
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      logger.error(`⏱️ Request timeout for ${url}`, { endpoint: type, playerId, timeout: API_REQUEST_TIMEOUT });
      throw new Error(`Request timeout after ${API_REQUEST_TIMEOUT}ms`);
    }
    throw error;
  }
}

/**
 * Estimate the value of equipment items
 * @param equipment Equipment items
 * @returns Estimated value in silver
 */
export async function estimateEquipmentValue(
  equipment: Record<string, { Type: string; Quality: number } | null | undefined>,
): Promise<number> {
  const items = Object.values(equipment || {}).filter(Boolean) as { Type: string; Quality: number }[];
  const totalItems: number = items.length;
  if (totalItems === 0) return 0;

  const excludedLocation = "Black Market";

  // Create promises for each item
  const pricePromises = items.map(async (item) => {
    const itemId = item.Type;
    const quality = item.Quality;

    if (!itemId) return 0;

    try {
      const priceUrl = `${ALBION_PRICE_API_URL}/prices/${itemId}.json?qualities=${quality}`;
      const res = await fetch(priceUrl);
      const data = await res.json();

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

  // Execute all promises in parallel and sum the results
  const prices = await Promise.all(pricePromises);
  return prices.reduce((total, price) => total + price, 0);
}