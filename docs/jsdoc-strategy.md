# Stratégie de Documentation JSDoc en Français

## Modèles de Documentation

### Pour les fonctions publiques exportées

```typescript
/**
 * Description de ce que fait la fonction
 * 
 * @param paramName - Description du paramètre
 * @param paramName2 - Description du deuxième paramètre
 * @returns Description de ce que retourne la fonction
 * @throws Description des erreurs potentielles
 */
```

### Pour les fonctions internes (non exportées)

```typescript
/**
 * Description de ce que fait la fonction
 * 
 * @param paramName - Description du paramètre
 * @returns Description de ce que retourne la fonction
 */
```

### Pour les classes

```typescript
/**
 * Description de la classe
 */
class MaClasse {
    /**
     * Description de la propriété
     */
    maPropriété: string;

    /**
     * Constructeur de la classe
     * 
     * @param param - Description du paramètre
     */
    constructor(param: string) {
        // ...
    }

    /**
     * Description de la méthode
     * 
     * @param param - Description du paramètre
     * @returns Description de ce que retourne la méthode
     */
    maMethode(param: string): string {
        // ...
    }
}
```

### Pour les types et interfaces

```typescript
/**
 * Description du type ou de l'interface
 */
type MonType = {
    /**
     * Description de la propriété
     */
    propriété: string;
};
```

## Traductions Communes

### Termes généraux
- Function: Fonction
- Method: Méthode
- Class: Classe
- Interface: Interface
- Type: Type
- Parameter: Paramètre
- Return: Retourne
- Error: Erreur
- Throws: Lance

### Phrases communes
- "Returns the player information": "Retourne les informations du joueur"
- "Throws an error if...": "Lance une erreur si..."
- "Handles the command execution": "Gère l'exécution de la commande"
- "Formats the date": "Formate la date"
- "Creates a new instance": "Crée une nouvelle instance"
- "Processes the data": "Traite les données"
- "Fetches data from API": "Récupère les données depuis l'API"
- "Logs the message": "Enregistre le message"
- "Validates the input": "Valide les données d'entrée"
- "Converts the format": "Convertit le format"

## Exemples Basés sur le Code Existant

### Exemple de fonction d'API (basé sur albionApi.ts)

```typescript
/**
 * Récupère les détails d'un joueur par son ID
 * 
 * @param playerId - ID du joueur Albion Online
 * @returns Informations détaillées du joueur
 */
export async function getPlayerInfo(playerId: string): Promise<PlayerInfo> {
  // ...
}
```

### Exemple de fonction utilitaire

```typescript
/**
 * Formate une date au format français (DD/MM/YYYY HH:MM)
 * 
 * @param dateStr - Chaîne de caractères représentant une date
 * @returns Date formatée au format français
 */
function formatDateFR(dateStr: string): string {
  // ...
}
```

### Exemple de gestionnaire de commande

```typescript
/**
 * Exécute la commande d'historique du joueur
 * 
 * @param interaction - L'interaction Discord qui a déclenché la commande
 * @returns Promise void
 * @throws Erreur si le joueur n'est pas trouvé ou si l'historique est vide
 */
async function executeCommand(interaction: ChatInputCommandInteraction) {
  // ...
}
```