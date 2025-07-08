import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder,
} from "discord.js";

const baseUrl = "https://gameinfo-ams.albiononline.com/api/gameinfo";

export const data = new SlashCommandBuilder()
    .setName("guild")
    .setDescription("Affiche les informations d'une guilde Albion Online")
    .addStringOption((option) =>
        option
            .setName("nom")
            .setDescription("Nom de la guilde")
            .setRequired(true),
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    const nomGuilde = interaction.options.getString("nom", true);

    try {
        console.log(`🔍 Recherche de la guilde "${nomGuilde}"...`);
        const searchUrl = `${baseUrl}/search?q=${encodeURIComponent(nomGuilde)}`;
        console.log(`📤 Requête : GET ${searchUrl}`);

        const searchRes = await fetch(searchUrl);
        const searchJson = await searchRes.json();

        if (!searchJson.guilds?.length) {
            console.warn(`⚠️ Aucune guilde trouvée pour "${nomGuilde}".`);
            return interaction.reply({
                content: `🚫 Aucune guilde trouvée pour « ${nomGuilde} »`,
                flags: ['Ephemeral'],
            });
        }

        const guilde = searchJson.guilds[0];
        const guildId = guilde.Id;

        console.log(`✅ Guilde trouvée : ${guilde.Name} (ID: ${guildId})`);
        const infoUrl = `${baseUrl}/guilds/${guildId}`;
        console.log(`📤 Requête : GET ${infoUrl}`);

        const infosRes = await fetch(infoUrl);
        const infos = await infosRes.json();

        console.log(`📥 Données récupérées pour la guilde : ${infos.Name}`);

        const embed = new EmbedBuilder()
            .setTitle(infos.Name)
            .setDescription(`🛡️ Alliance : ${infos.AllianceTag || "Aucune"}`)
            .addFields(
                {
                    name: "📅 Créée le",
                    value: new Date(infos.Founded).toLocaleDateString(),
                    inline: true,
                },
                {
                    name: "👑 Fondateur",
                    value: infos.FounderName || "Inconnu",
                    inline: true,
                },
                {
                    name: "👥 Membres",
                    value: infos.MemberCount?.toString() ?? "0",
                    inline: true,
                },
                {
                    name: "🏆 Kill Fame",
                    value: infos.killFame?.toLocaleString() ?? "0",
                    inline: true,
                },
                {
                    name: "💀 Death Fame",
                    value: infos.DeathFame?.toLocaleString() ?? "0",
                    inline: true,
                },
            )
            .setFooter({ text: `ID : ${infos.Id}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    } catch (err) {
        console.error("❌ Erreur dans /guild :", err);
        await interaction.reply({
            content: "❌ Impossible de récupérer les infos de la guilde.",
            flags: ['Ephemeral'],
        });
    }
}
