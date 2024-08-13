"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const Event_1 = __importDefault(require("../../strcut/base/Event"));
const EmbedBuilder_1 = __importDefault(require("../../strcut/utils/EmbedBuilder"));
exports.default = new Event_1.default({
    name: 'emojiStorageUpdate'
}, async (client, channel) => {
    main(client, channel);
});
function main(client, channel) {
    try {
        let embeds = [new EmbedBuilder_1.default().settingRoomEmbed(client)];
        let components = [new discord_js_1.ActionRowBuilder(), new discord_js_1.ActionRowBuilder()];
        let config = client.config.settings;
        let buttons = config.buttons;
        Object.keys(buttons).forEach((btn, i) => {
            components[i % 2].addComponents(new discord_js_1.ButtonBuilder().setCustomId(Object.keys(config.buttons)[i]).setEmoji(client.emojisStorage.cache.get(Object.keys(config.buttons)[i]).toString()).setStyle(config.style));
        });
        client.db.creators.forEach(async (creator) => {
            let textChannel = client.channels.cache.get(creator.textChannelId);
            if (textChannel) {
                try {
                    await textChannel.bulkDelete(100);
                    textChannel.fetchWebhooks().then(async (webhooks) => {
                        let webhook;
                        if (!webhooks.size) {
                            webhook = await textChannel.createWebhook({
                                name: client.config.settings.webhook.name,
                                avatar: `${__dirname}/../../../assets/avatar.png`
                            });
                        }
                        else {
                            webhook = webhooks.find(webhook => webhook.owner.id === client.user.id);
                            if (webhook)
                                await webhook.edit({ name: client.config.settings.webhook.name, avatar: `${__dirname}/../../../assets/avatar.png` });
                        }
                        if (webhook) {
                            webhook?.send({ embeds, components });
                        }
                    });
                }
                catch (e) { }
            }
        });
    }
    catch (e) {
        setTimeout(() => {
            main(client, channel);
        }, 1000);
    }
}
