# 🛡️ Captain Flynn Swift — Bot Discord Albion Online

Bot Discord personnel pour explorer les données des joueurs sur **Albion Online** via l'API officielle.

---

## 🎯 Objectif

Ce bot Discord permet de :

- 🔍 Rechercher des informations sur un joueur d'Albion Online (statistiques générales, historiques, etc.).
- 🧾 Générer une **image personnalisée** représentant un kill (template) avec les équipements du tueur et de la victime.
- 📊 Afficher les scores de renommée (fame), les ratios K/D, les guildes et alliances, etc.

Il est conçu pour un usage personnel ou entre amis fans du jeu.

---

## 📁 Structure du projet

````
/src
  /commands
    guild.ts            // Affiche les informations d'une guilde
    ping.ts             // Commande de test
    playerhistory.ts    // Affiche les derniers kills/décès d'un joueur
    playerstats.ts      // Montre les stats détaillées d’un joueur
    template.ts         // Génère une image avec l'équipement d’un kill
  config.ts             // Lecture du token & config depuis .env
  index.ts              // Entrée principale, enregistre et démarre le bot
/assets
  template.png          // Image de fond du template d’équipement
  UncialAntiqua.ttf     // (Optionnel) Police médiévale pour le rendu visuel
````

---

## 🧩 Commandes disponibles

### `/ping`

Commande de test pour vérifier que le bot fonctionne.

---

### `/guild`

Affiche des informations sur une guilde : nom, nombre de membres, alliance, etc. (à compléter).

---

### `/playerstats`

Affiche les **statistiques complètes** d’un joueur :

* 🎮 Pseudo
* 👑 Guilde et alliance (affiché sur une seule ligne)
* 🏆 Total Fame
* 📈 Kill Fame
* 💀 Death Fame
* 🎯 PvE Fame
* ⚒️ Crafting Fame
* 🪓 Gathering Fame
* 🎯 Ratio K/D

---

### `/playerhistory`

Affiche les **derniers combats** (kills ou morts) d’un joueur.

* 🔺 Tueur : pseudo, renommée gagnée, ip
* 🔻 Victime : pseudo, ip
* ⏱️ Date du combat

---

### `/template`

Génère une image dans le style d’Albion Online :

* 📸 Image de fond personnalisée (template.png)
* 🎽 Affiche les équipements du tueur (gauche) et de la victime (droite)
* 🧠 Utilise l’API officielle pour récupérer les items avec qualité, enchantement, etc.
* 🧾 Affiche en haut les pseudos, guildes et alliances

---

## ⚙️ Détails techniques

* **Langage** : TypeScript

* **Librairies** :

  * `discord.js` pour l’interaction avec l’API Discord
  * `@napi-rs/canvas` pour le rendu des images (performant)
  * `dotenv` pour la configuration depuis `.env`
  * `node-fetch` pour les appels HTTP à l’API Albion

* **Style d’image** :

  * Canvas 1200x610
  * Les items sont positionnés précisément
  * Le texte est centré au-dessus des joueurs
  * La police par défaut est `Georgia`

---