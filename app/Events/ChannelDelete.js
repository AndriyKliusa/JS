"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Event_1 = __importDefault(require("../../strcut/base/Event"));
exports.default = new Event_1.default({
    name: 'channelDelete'
}, async (client, channel) => {
    let creator = client.db.creators.find(c => c.categoryId === channel.id || c.voiceChannelId === channel.id || c.textChannelId === channel.id);
    if (creator) {
        let voice = client.channels.cache.get(creator.voiceChannelId);
        let text = client.channels.cache.get(creator.textChannelId);
        let category = client.channels.cache.get(creator.categoryId);
        if (voice)
            voice.delete();
        if (text)
            text.delete();
        if (category)
            category.delete();
        client.db.creators.delete(`${creator.guildId}.${creator.categoryId}`);
    }
});
