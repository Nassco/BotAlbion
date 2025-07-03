# BotAlbion

Capitaine Flynn Swift, éclaireur de Lymhurst, vous apporte toutes les infos d'Albion Online : statistiques de joueurs et guildes, top kills, suivi du killboard, alertes et événements. Un compagnon complet pour tout aventurier d'Albion.

## Fonctionnalités

- Statistiques de joueurs et guildes
- Top kills et suivi du killboard
- Alertes et événements
- Et plus encore...

## Prérequis

- [Node.js](https://nodejs.org/) (v16.9.0 ou plus récent)
- Un [compte développeur Discord](https://discord.com/developers/applications) pour créer un bot

## Installation

1. Clonez ce dépôt
   ```
   git clone https://github.com/votre-username/BotAlbion.git
   cd BotAlbion
   ```

2. Installez les dépendances
   ```
   npm install
   ```

3. Configurez le bot
   - Renommez `config.json` et ajoutez votre token Discord et autres informations
   - Vous pouvez obtenir un token en créant une application sur le [portail développeur Discord](https://discord.com/developers/applications)

4. Démarrez le bot
   ```
   npm start
   ```

## Commandes

Le préfixe par défaut est `!`. Voici quelques exemples de commandes:

- `!player [nom]` - Affiche les statistiques d'un joueur
- `!guild [nom]` - Affiche les informations d'une guilde
- `!kills [nom]` - Affiche les derniers kills d'un joueur

## Développement

Pour lancer le bot en mode développement avec redémarrage automatique:

```
npm run dev
```

## Contribuer

Les contributions sont les bienvenues! N'hésitez pas à ouvrir une issue ou une pull request.

## Licence

Ce projet est sous licence MIT.
