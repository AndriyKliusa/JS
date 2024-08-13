"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const Interaction_1 = __importDefault(require("../../strcut/base/Interaction"));
const EmbedBuilder_1 = __importDefault(require("../../strcut/utils/EmbedBuilder"));
//@ts-ignore
exports.default = new Interaction_1.default('create-voice', async (client, interaction) => {
    client.db.creators.create(interaction.guild.id);
    interaction.reply({ embeds: [new EmbedBuilder_1.default().default(interaction.member, 'Успех', 'Система управления приватными каналами успешно создана')], ephemeral: true });
    return;
}, {
    name: 'create-voice',
    type: discord_js_1.ApplicationCommandType.ChatInput,
    description: 'Создать систему управления приватными каналами',
    defaultMemberPermissions: discord_js_1.PermissionFlagsBits.Administrator
});
