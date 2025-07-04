import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Répond Pong!");

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply("🏓 Pong!");
}
