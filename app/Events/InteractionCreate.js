"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const EmbedBuilder_1 = __importDefault(require("../../strcut/utils/EmbedBuilder"));
const Event_1 = __importDefault(require("../../strcut/base/Event"));
exports.default = new Event_1.default({
    name: 'interactionCreate'
}, async (client, interaction) => {
    const member = interaction.member;
    const config = client.config.settings;
    const room = client.db.rooms.get(`${member.voice?.channelId}`);
    const settings = await client.db.settings.dbGet(member.id);
    if (interaction.isButton()) {
        const get = client.util.getButton(interaction.customId);
        if (get) {
            if (interaction.customId !== 'info' && room?.ownerId !== member.id) {
                return interaction.reply({
                    embeds: [new EmbedBuilder_1.default().default(member, 
                        //@ts-ignore
                        config.buttons[interaction.customId]?.title || 'Неизвестная интеракция', 'Вы **не** находитесь в **своей** приватной комнате')], ephemeral: true
                });
            }
            return get.run(client, interaction, config);
        }
    }
    if (interaction.isCommand()) {
        const get = client.util.getCommand(interaction.commandName);
        if (get) {
            return get.run(client, interaction);
        }
    }
    if (interaction.isModalSubmit()) {
        const get = client.util.getModal(interaction.customId);
        if (get) {
            if (room.ownerId !== member.id) {
                return interaction.reply({
                    embeds: [new EmbedBuilder_1.default().default(member, 
                        //@ts-ignore
                        config.buttons[interaction.customId]?.title || 'Неизвестная интеракция', 'Вы **не** находитесь в **своей** приватной комнате')], ephemeral: true
                });
            }
            return get.run(client, interaction, config, settings, room);
        }
        return interaction.reply({ content: 'Неизвестная интеракция', ephemeral: true });
    }
});
