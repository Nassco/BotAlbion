import dotenv from 'dotenv';
dotenv.config();

if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) {
    throw new Error('❌ DISCORD_TOKEN ou CLIENT_ID manquant dans .env');
}

const config = {
    token: process.env.DISCORD_TOKEN!,
    clientId: process.env.CLIENT_ID!,
    guildIds: process.env.GUILD_IDS?.split(",").map((id) => id.trim()) ?? [],
};

export default config;