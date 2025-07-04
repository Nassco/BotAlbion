# 🤖 Bot Discord – Captain Flynn Swift

## 📌 Description générale

Captain Flynn Swift est un bot Discord développé pour l'univers du jeu **Albion Online**. Il permet de récupérer et d'afficher différentes informations liées aux joueurs et aux combats (PvP) du jeu via l’API officielle. Le bot utilise également la bibliothèque `@napi-rs/canvas` pour générer des **images visuelles stylisées** (template d'équipement de kill, etc.).

Ce bot est principalement destiné à un usage personnel ou communautaire autour d’Albion Online, avec un focus sur l’analyse de joueurs, le suivi de statistiques et la visualisation des kills.

---

## ⚙️ Commandes disponibles

### `/ping`
Commande de test simple pour vérifier que le bot est en ligne.  
**Réponse** : "Pong!"

---

### `/guild`
Affiche les statistiques principales d’une guilde Albion Online.  
**Paramètres** :
- `nom de la guilde` *(string)*

**Données récupérées** :
- Nombre de membres
- Fame total
- Alliances associées

---

### `/playerstats`
Affiche les statistiques détaillées d’un joueur.  
**Paramètres** :
- `pseudo` *(string)*

**Données affichées** :
- PvE Fame, Kill Fame, Death Fame, K/D ratio
- Gathering Fame par ressource (bois, pierre, minerai, etc.)
- Activité en Crystal League, Hellgates, Mists, etc.

---

### `/playerhistory`
Affiche l'historique des récents combats d’un joueur.  
**Paramètres** :
- `pseudo` *(string)*

**Données affichées** :
- Derniers kills / morts
- Date, victimes/tueurs, fame, localisation

---

### `/template`
Génère une image contenant l’équipement d’un **kill récent**.  
Actuellement configuré pour récupérer automatiquement les derniers kills d’un joueur spécifique (ex. : Nassco).  

**Image générée** :
- Affichage visuel des équipements du tueur et de la victime
- Noms, tags d’alliance et de guilde en haut
- Design inspiré de l’univers du jeu

---

## 🖼️ Particularités

- Génération d’image personnalisée avec `@napi-rs/canvas`
- Affichage centré des noms + alliances dans le style visuel d'Albion
- Style typographique ajustable (ex : `Georgia` ou une police custom comme `Uncial Antiqua`)
- Gestion robuste des erreurs et du chargement des images via l’API de rendu Albion

---