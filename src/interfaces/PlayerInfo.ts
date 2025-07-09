export interface PlayerInfo {
  AverageItemPower: number;
  Equipment: {
    MainHand: EquipmentItem | null;
    OffHand: EquipmentItem | null;
    Head: EquipmentItem | null;
    Armor: EquipmentItem | null;
    Shoes: EquipmentItem | null;
    Bag: EquipmentItem | null;
    Cape: EquipmentItem | null;
    Mount: EquipmentItem | null;
    Potion: EquipmentItem | null;
    Food: EquipmentItem | null;
  };
  Inventory: EquipmentItem[];
  Name: string;
  Id: string;
  GuildName?: string;
  GuildId?: string;
  AllianceName?: string;
  AllianceId?: string;
  AllianceTag?: string;
  Avatar?: string;
  AvatarRing?: string;
  DeathFame: number;
  KillFame: number;
  FameRatio: number;
  LifetimeStatistics: {
    PvE: PvEStats;
    Gathering: GatheringStats;
    Crafting: RegionStatBlock;
    CrystalLeague: number;
    FishingFame: number;
    FarmingFame: number;
    Timestamp: string;
  };
}

export interface EquipmentItem {
  Type: string;
  Quality: number;
  Count?: number;
}

export interface PvEStats {
  Total: number;
  Royal: number;
  Outlands: number;
  Avalon: number;
  Hellgate: number;
  CorruptedDungeon: number;
  Mists: number;
}

export interface GatheringStats {
  Fiber: RegionStatBlock;
  Hide: RegionStatBlock;
  Ore: RegionStatBlock;
  Rock: RegionStatBlock;
  Wood: RegionStatBlock;
  All: RegionStatBlock;
}

export interface RegionStatBlock {
  Total: number;
  Royal: number;
  Outlands: number;
  Avalon: number;
}
