"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const config_1 = require("../../config");
const Utils_1 = __importDefault(require("./Utils"));
class EmbedBuilder extends discord_js_1.EmbedBuilder {
    default(member, title, description) {
        return this.setTitle(title).setColor(config_1.settings.color)
            .setDescription(`${member.toString()}, ${description}`)
            .setThumbnail(Utils_1.default.getAvatar(member));
    }
    settingRoomEmbed(client) {
        return this.setTitle('Управление приватной комнатой')
            .setColor(config_1.settings.color)
            .setDescription('> Жми следующие кнопки, чтобы настроить свою комнату' + '\n').setImage(config_1.settings?.line ? 'https://cdn.discordapp.com/attachments/966972126806573089/1104607266533031966/line.png' : null)
            .setURL('https://github.com/HekaHub/Discord-Voice-Manager')
            .addFields([{
                name: '** **',
                value: Object.keys(config_1.settings.buttons).filter((btn, i) => i % 2 == 0)
                    .map(btn => 
                //@ts-ignore
                (config_1.settings.dot || '') + (config_1.settings.buttons[btn] ? (`${client.emojisStorage.cache.get(btn)} ・ ${config_1.settings.buttons[btn].title.toLowerCase()}`) : '')).join('\n'),
                inline: true
            },
            {
                name: '** **',
                value: Object.keys(config_1.settings.buttons).filter((btn, i) => i % 2 == 1)
                    .map(btn => 
                //@ts-ignore
                (config_1.settings.dot || '') + (config_1.settings.buttons[btn] ? (`${client.emojisStorage.cache.get(btn)} ・ ${config_1.settings.buttons[btn].title.toLowerCase()}`) : '')).join('\n'),
                inline: true
            }
        ])
            .setFooter({ text: 'Использовать их можно только когда у тебя есть приватный канал' });
    }
    infoRoom(member, channel, get) {
        const guildPerms = channel.permissionOverwrites.cache.get(member.guild.id);
        //@ts-ignore
        return this.setTitle(config_1.settings.buttons['info'].title)
            .setThumbnail(Utils_1.default.getAvatar(member))
            .setColor(config_1.settings.color)
            .setDescription('**Приватная комната:**' + ` ${channel.toString()}` + '\n'
            + '**Пользователи:**' + ` ${channel.members.size}/${channel.userLimit === 0 ? 'ꝏ' : channel.userLimit}` + '\n'
            + '**Владелец:**' + ` <@!${get.userId}>` + '\n'
            + '**Время создания:**' + ` <t:${Math.round(get.created / 1000)}>` + '\n'
            + '**Видна ли комната всем:**' + ` ${guildPerms && guildPerms.deny.has('ViewChannel') ? '❌' : '✅'}` + '\n'
            + '**Доступна ли комната всем:**' + ` ${guildPerms && guildPerms.deny.has('Connect') ? '❌' : '✅'}` + '\n');
    }
    permissions(member, channel, page = 0) {
        const array = channel.permissionOverwrites.cache
            .filter(p => channel.guild.members.cache.has(p.id))
            .map(p => p);
        const max = Math.ceil(array.length / 5) === 0 ? 1 : Math.ceil(array.length / 5);
        const embed = this.setTitle('Права пользователей приватной комнаты')
            .setThumbnail(Utils_1.default.getAvatar(member))
            .setColor(config_1.settings.color)
            .setFooter({ text: `Страница: ${page + 1}/${max}` });
        for (let i = page * 5; (i < array.length && i < 5 * (page + 1)); i++) {
            const p = array[i];
            const target = member.guild.members.cache.get(p.id);
            if (target) {
                embed.addFields({
                    name: `${i + 1}. ${target.displayName}`,
                    value: (`> Подключиться: ${p.deny.has('Connect') ? '❌' : '✅'}` + '\n'
                        + `> Говорить: ${p.deny.has('Speak') ? '❌' : '✅'}`)
                });
            }
        }
        return embed.setDescription((embed.data.fields || [])?.length === 0 ? 'Пусто' : null);
    }
}
exports.default = EmbedBuilder;
