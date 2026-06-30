import { EquipmentItem } from './PlayerInfo.js';

/**
 * Interface for player search results
 */
export interface PlayerSearchResult {
  players: PlayerSearchEntry[];
}

export interface PlayerSearchEntry {
  Id: string;
  Name: string;
  GuildId?: string;
  GuildName?: string;
  AllianceId?: string;
  AllianceName?: string;
}

/**
 * Interface for history entries (kills and deaths)
 */
export interface HistoryEntry {
  EventId: string;
  TimeStamp: string;
  TotalVictimKillFame: number;
  Killer: CombatParticipant;
  Victim: CombatParticipant;
  Participants?: CombatParticipant[];
  GroupMembers?: CombatParticipant[];
}

export interface CombatParticipant {
  Id?: string;
  Name?: string;
  GuildId?: string;
  GuildName?: string;
  AllianceId?: string;
  AllianceName?: string;
  AverageItemPower?: number;
  Equipment?: {
    MainHand?: EquipmentItem | null;
    OffHand?: EquipmentItem | null;
    Head?: EquipmentItem | null;
    Armor?: EquipmentItem | null;
    Shoes?: EquipmentItem | null;
    Bag?: EquipmentItem | null;
    Cape?: EquipmentItem | null;
    Mount?: EquipmentItem | null;
    Potion?: EquipmentItem | null;
    Food?: EquipmentItem | null;
  };
  Inventory?: (EquipmentItem | null)[];
}

/**
 * Interface for price API response
 */
export interface PriceEntry {
  item_id: string;
  city: string;
  quality: number;
  sell_price_min: number;
  sell_price_max: number;
  buy_price_min: number;
  buy_price_max: number;
  sell_price_min_date: string;
  sell_price_max_date: string;
  buy_price_min_date: string;
  buy_price_max_date: string;
}