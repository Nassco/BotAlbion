# Stratégie de Standardisation des Commandes

## Principes Généraux

1. **Gestion des Erreurs**
   - Utiliser le wrapper `withErrorHandling` pour toutes les commandes
   - Utiliser les types d'erreurs définis dans `ErrorType` enum
   - Créer des erreurs typées avec `createError`
   - Gérer les cas d'erreur spécifiques avec des messages appropriés

2. **Logging**
   - Utiliser le module `logger` au lieu de `console.log/warn/error`
   - Inclure des métadonnées pertinentes dans les logs
   - Utiliser les niveaux de log appropriés (info, warn, error, http)
   - Utiliser des emojis cohérents dans les messages de log

3. **Constants**
   - Utiliser les constantes définies dans `constants.ts`
   - Extraire les valeurs codées en dur vers des constantes
   - Importer les constantes avec l'extension `.js` (conformément au pattern existant)

4. **Documentation**
   - Ajouter des commentaires JSDoc pour les fonctions exportées
   - Documenter les paramètres et les valeurs de retour
   - Documenter les erreurs potentielles
   - Suivre le style de documentation en français

## Modèle de Structure de Commande

```typescript
import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    // Autres imports Discord.js
} from "discord.js";
import { CONSTANTE1, CONSTANTE2 } from "../constants.js";
import logger from "../utils/logger.js";
import { withErrorHandling, createError, ErrorType } from "../utils/errorHandler.js";
// Autres imports nécessaires

/**
 * Configuration de la commande slash Discord
 */
export const data = new SlashCommandBuilder()
    .setName("nom_commande")
    .setDescription("Description de la commande");
    // Options de commande...

/**
 * Exécute la commande
 * 
 * @param interaction - L'interaction Discord qui a déclenché la commande
 * @throws Erreur si [conditions d'erreur]
 */
async function executeCommand(interaction: ChatInputCommandInteraction) {
    // Extraction des options
    const option = interaction.options.getString("option", true);
    
    // Logging initial
    logger.info(`🔍 /nom_commande ${option}`, { 
        command: 'nom_commande', 
        option 
    });
    
    try {
        // Logique de la commande
        
        // Logging des étapes importantes
        logger.info(`✅ Étape importante réalisée`, { 
            command: 'nom_commande',
            // Métadonnées pertinentes
        });
        
        // Réponse à l'utilisateur
        await interaction.reply({ /* réponse */ });
    } catch (error) {
        // Gestion des erreurs spécifiques
        if (error instanceof SomeSpecificError) {
            logger.warn(`⚠️ Erreur spécifique`, { 
                command: 'nom_commande', 
                error 
            });
            throw createError("Message d'erreur", ErrorType.SPECIFIC_ERROR_TYPE);
        }
        
        // Propagation des autres erreurs pour être gérées par withErrorHandling
        throw error;
    }
}

/**
 * Exporte la fonction d'exécution de la commande avec gestion des erreurs
 * Cette fonction est appelée par le gestionnaire de commandes Discord
 */
export const execute = withErrorHandling(executeCommand, "nom_commande");
```

## Exemples de Logs Standardisés

- **Début de commande**: `🔍 /nom_commande option_value`
- **Requête API**: `📤 Requête : GET url_api`
- **Réponse API**: `📥 Données récupérées : description_données`
- **Succès**: `✅ Action réussie : description_succès`
- **Avertissement**: `⚠️ Avertissement : description_avertissement`
- **Erreur**: `❌ Erreur : description_erreur`

## Métadonnées de Log Standardisées

- `command`: Nom de la commande
- `user`: Tag de l'utilisateur (si pertinent)
- `options`: Options de la commande (si pertinent)
- `error`: Objet d'erreur (pour les logs d'erreur)
- Autres métadonnées spécifiques à la commande

## Gestion des Interactions Utilisateur

- Utiliser des flags d'éphémère pour les messages d'erreur
- Gérer correctement les états d'interaction (deferred, replied)
- Vérifier l'utilisateur pour les interactions de bouton