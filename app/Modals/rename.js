"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const EmbedBuilder_1 = __importDefault(require("../../strcut/utils/EmbedBuilder"));
const Interaction_1 = __importDefault(require("../../strcut/base/Interaction"));
exports.default = new Interaction_1.default('rename', async (client, modal, config, res, room) => {
    await modal.deferReply({ ephemeral: true });
    const name = modal.fields.getTextInputValue('name');
    const voice = modal.member.voice.channel;
    if (room) {
        if (room.cooldown > Date.now()) {
            return modal.editReply({
                embeds: [new EmbedBuilder_1.default().default(modal.member, config.buttons[modal.customId].title, `**приватную комнату** ${voice.toString()} можно будет **переименовать** через **<t:${Math.round(room.cooldown / 1000)}:R>**`)]
            });
        }
    }
    let cd = Date.now();
    if (room.cooldown > Date.now() - 10 * 1000 * 60)
        cd += 10 * 60 * 1000;
    room.cooldown = cd;
    await client.db.rooms.dbSet(room);
    res.name = name;
    await client.db.settings.dbSet(res);
    await voice.setName(name);
    return modal.editReply({
        embeds: [new EmbedBuilder_1.default().default(modal.member, config.buttons[modal.customId].title, `Вы **установили** новое имя для своей **приватной комнаты** ${voice.toString()}`)]
    });
});
