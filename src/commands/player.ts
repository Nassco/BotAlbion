import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder,
} from 'discord.js';

const baseUrl = 'https://gameinfo-ams.albiononline.com/api/gameinfo';

export const data = new SlashCommandBuilder()
    .setName('player')
    .setDescription("Affiche les stats d'un joueur Albion Online")
    .addStringOption(option =>
        option.setName('pseudo').setDescription('Nom du joueur').setRequired(true)
    )
    .addStringOption(option =>
        option
            .setName('type')
            .setDescription("Type d'infos à afficher")
            .addChoices(
                { name: 'Statistiques', value: 'default' },
                { name: 'Dernières morts', value: 'deaths' },
                { name: 'Derniers kills', value: 'kills' }
            )
            .setRequired(false)
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    const pseudo = interaction.options.getString('pseudo', true);
    const type = interaction.options.getString('type') ?? 'default';

    console.log(`🔍 /player ${pseudo} (type: ${type})`);

    try {
        const searchUrl = `${baseUrl}/search?q=${encodeURIComponent(pseudo)}`;
        console.log(`📡 GET ${searchUrl}`);
        const searchRes = await fetch(searchUrl);
        const searchJson = await searchRes.json();

        if (!searchJson.players?.length) {
            return interaction.reply({ content: `🚫 Aucun joueur trouvé pour « ${pseudo} »`, ephemeral: true });
        }

        const player = searchJson.players[0];
        const id = player.Id;

        // 💀 Mode "deaths"
        if (type === 'deaths') {
            const deathsUrl = `${baseUrl}/players/${id}/deaths`;
            console.log(`📡 GET ${deathsUrl}`);
            const deathsRes = await fetch(deathsUrl);
            const deaths = await deathsRes.json();

            if (!deaths.length) {
                return interaction.reply({ content: `😇 Aucune mort récente trouvée pour ${pseudo}`, ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setTitle(`💀 Dernières morts de ${pseudo}`)
                .setColor(0xff0000)
                .setTimestamp();

            deaths.slice(0, 5).forEach((death: any, index: number) => {
                embed.addFields({
                    name: `#${index + 1} - ${new Date(death.TimeStamp).toLocaleString()}`,
                    value: `Tueur : ${death.Killer?.Name || 'Inconnu'}\nFame perdu : ${(death.TotalVictimKillFame ?? 0).toLocaleString()}`
                });
            });

            embed.addFields({
                name: '📎 Voir plus',
                value: `[Killboard publique](https://albiononline2d.com/en/player/${id})`
            });

            return interaction.reply({ embeds: [embed] });
        }

        // ⚔️ Mode "kills"
        if (type === 'kills') {
            const killsUrl = `${baseUrl}/players/${id}/kills`;
            console.log(`📡 GET ${killsUrl}`);
            const killsRes = await fetch(killsUrl);
            const kills = await killsRes.json();

            if (!kills.length) {
                return interaction.reply({ content: `🤷 Aucun kill récent trouvé pour ${pseudo}`, ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setTitle(`⚔️ Derniers kills de ${pseudo}`)
                .setColor(0x00cc99)
                .setTimestamp();

            kills.slice(0, 5).forEach((kill: any, index: number) => {
                embed.addFields({
                    name: `#${index + 1} - ${new Date(kill.TimeStamp).toLocaleString()}`,
                    value: `Victime : ${kill.Victim?.Name || 'Inconnue'}\nFame gagné : ${(kill.TotalVictimKillFame ?? 0).toLocaleString()}`
                });
            });

            embed.addFields({
                name: '📎 Voir plus',
                value: `[Killboard publique](https://albiononline2d.com/en/player/${id})`
            });

            return interaction.reply({ embeds: [embed] });
        }

        // 📊 Mode "default" (statistiques globales)
        const statsUrl = `${baseUrl}/players/${id}`;
        console.log(`📡 GET ${statsUrl}`);
        const statsRes = await fetch(statsUrl);
        const stats = await statsRes.json();

        console.log(`✅ Stats trouvées pour ${stats.Name} (${stats.Id})`);

        const fameTotal =
            (stats.KillFame ?? 0) +
            (stats.LifetimeStatistics?.PvE?.Total ?? 0) +
            (stats.LifetimeStatistics?.Gathering?.All?.Total ?? 0) +
            (stats.LifetimeStatistics?.Crafting?.Total ?? 0);

        const embed = new EmbedBuilder()
            .setTitle(stats.Name)
            .setThumbnail(`https://render.albiononline.com/v1/avatar/${stats.Avatar}.png?ring=${stats.AvatarRing}`)
            .setDescription(`**Guilde**: ${stats.GuildName || 'Aucune'}\n**Alliance**: ${stats.AllianceName || 'Aucune'}`)
            .addFields(
                { name: '🏆 Fame Total', value: fameTotal.toLocaleString(), inline: true },
                { name: '📈 Kill Fame', value: (stats.KillFame ?? 0).toLocaleString(), inline: true },
                { name: '💀 Death Fame', value: (stats.DeathFame ?? 0).toLocaleString(), inline: true },
                { name: '🎯 PvE Fame', value: stats.LifetimeStatistics?.PvE?.Total?.toLocaleString() ?? '0', inline: true },
                { name: '🏹 Gathering Fame', value: stats.LifetimeStatistics?.Gathering?.All?.Total?.toLocaleString() ?? '0', inline: true },
                { name: '⚒️ Crafting Fame', value: stats.LifetimeStatistics?.Crafting?.Total?.toLocaleString() ?? '0', inline: true },
                { name: '🎯 K/D Ratio', value: (stats.FameRatio ?? 0).toFixed(2), inline: true },
                { name: '📎 Voir plus', value: `[Killboard publique](https://albiononline2d.com/en/player/${id})`, inline: false }
            )
            .setFooter({ text: `ID : ${stats.Id}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });

    } catch (err) {
        console.error(`❌ Erreur dans /player :`, err);
        await interaction.reply({
            content: '❌ Impossible de récupérer les infos du joueur.',
            ephemeral: true,
        });
    }
}
