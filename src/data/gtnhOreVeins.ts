export type GtnhDimension = 'overworld' | 'nether' | 'end';

export interface GtnhOreVein {
    name: string;
    ores: string[];
    minY: number;
    maxY: number;
    dimension: GtnhDimension;
}

// Source: GTNH wiki / GregTech ore generation. Valeurs approximatives — vérifier sur le wiki GTNH.
export const GTNH_ORE_VEINS: GtnhOreVein[] = [
    // ── Overworld ──────────────────────────────────────────────────────────
    { name: 'Magnétite',             ores: ['Magnétite', 'Vanadium Magnétite', 'Minerai d\'Or'],              minY: 80,  maxY: 120, dimension: 'overworld' },
    { name: 'Limonite (Fer)',        ores: ['Limonite Brune', 'Limonite Jaune', 'Malachite', 'Goethite'],     minY: 10,  maxY: 40,  dimension: 'overworld' },
    { name: 'Fer Bandé',             ores: ['Fer Bandé', 'Limonite Brune', 'Magnétite'],                      minY: 60,  maxY: 120, dimension: 'overworld' },
    { name: 'Cassitérite (Étain)',   ores: ['Cassitérite', 'Sable de Cassitérite', 'Limonite Jaune'],        minY: 40,  maxY: 120, dimension: 'overworld' },
    { name: 'Chalcopyrite (Cuivre)', ores: ['Chalcopyrite', 'Minerai de Fer', 'Pyrite', 'Chalcocite'],       minY: 60,  maxY: 120, dimension: 'overworld' },
    { name: 'Tétraédrite (Cuivre)',  ores: ['Tétraédrite', 'Cuivre', 'Sphalerite', 'Pyrite'],                minY: 60,  maxY: 120, dimension: 'overworld' },
    { name: 'Charbon',               ores: ['Charbon', 'Lignite'],                                            minY: 60,  maxY: 100, dimension: 'overworld' },
    { name: 'Salpêtre',              ores: ['Salpêtre', 'Diatomite', 'Trona', 'Gypse'],                      minY: 20,  maxY: 60,  dimension: 'overworld' },
    { name: 'Pentlandite (Nickel)',  ores: ['Pentlandite', 'Minerai de Fer', 'Limonite Jaune', 'Garniérite'],minY: 10,  maxY: 30,  dimension: 'overworld' },
    { name: 'Bauxite (Aluminium)',   ores: ['Bauxite', 'Ilmenite', 'Rutile'],                                 minY: 50,  maxY: 80,  dimension: 'overworld' },
    { name: 'Monazite (Terres Rares)',ores: ['Bastnäsite', 'Monazite', 'Néodyme'],                           minY: 20,  maxY: 40,  dimension: 'overworld' },
    { name: 'Schéelite (Tungstène)', ores: ['Schéelite', 'Tungstite', 'Molybdenite', 'Powellite'],          minY: 20,  maxY: 52,  dimension: 'overworld' },
    { name: 'Pechblende (Uranium)',  ores: ['Pechblende', 'Uraninite', 'Thorium'],                           minY: 10,  maxY: 50,  dimension: 'overworld' },
    { name: 'Manganèse',             ores: ['Grossulaire', 'Spessartine', 'Pyrolusite', 'Tantalite'],        minY: 20,  maxY: 48,  dimension: 'overworld' },
    { name: 'Galène (Plomb/Argent)', ores: ['Galène', 'Minerai d\'Argent', 'Minerai de Plomb'],             minY: 20,  maxY: 64,  dimension: 'overworld' },
    { name: 'Lapis-Lazuli',          ores: ['Lapis-Lazuli', 'Sodalite', 'Calcite', 'Lazurite'],             minY: 20,  maxY: 50,  dimension: 'overworld' },
    { name: 'Redstone',              ores: ['Redstone', 'Cinabre', 'Rubis', 'Spessartine'],                  minY: 5,   maxY: 40,  dimension: 'overworld' },
    { name: 'Diamant',               ores: ['Diamant', 'Graphite', 'Charbon'],                               minY: 5,   maxY: 20,  dimension: 'overworld' },
    { name: 'Rubis / Saphir',        ores: ['Rubis', 'Saphir', 'Saphir Vert', 'Almandine'],                 minY: 20,  maxY: 60,  dimension: 'overworld' },
    { name: 'Platine (PGM)',         ores: ['Sperrylite', 'Platine', 'Palladium', 'Cooperite'],              minY: 40,  maxY: 100, dimension: 'overworld' },
    { name: 'Talc / Stéatite',       ores: ['Stéatite', 'Talc', 'Glauconite', 'Pentlandite'],              minY: 10,  maxY: 40,  dimension: 'overworld' },
    { name: 'Tantalite',             ores: ['Tantalite', 'Molybdenite', 'Grossulaire'],                      minY: 20,  maxY: 50,  dimension: 'overworld' },
    // ── Nether ─────────────────────────────────────────────────────────────
    { name: 'Quartz de Nether',      ores: ['Quartz de Nether'],                                             minY: 40,  maxY: 120, dimension: 'nether' },
    { name: 'Pyrite (Nether)',        ores: ['Pyrite', 'Stibnite', 'Millerite', 'Chalcocite'],              minY: 10,  maxY: 80,  dimension: 'nether' },
    { name: 'Apatite (Nether)',       ores: ['Apatite', 'Phosphate', 'Phosphorite'],                        minY: 20,  maxY: 40,  dimension: 'nether' },
    { name: 'Tungstène (Nether)',     ores: ['Volframite', 'Hübnerite', 'Ferberite'],                       minY: 10,  maxY: 80,  dimension: 'nether' },
    // ── End ────────────────────────────────────────────────────────────────
    { name: 'Naquadah',              ores: ['Naquadah', 'Naquadah Enrichi', 'Naquadria'],                   minY: 10,  maxY: 60,  dimension: 'end' },
    { name: 'Draconium',             ores: ['Draconium (Draconic Evolution)'],                               minY: 10,  maxY: 60,  dimension: 'end' },
];
