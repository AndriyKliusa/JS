"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
class VoiceManager {
    constructor() {
        this.permissionsRoomOwner = {
            allow: [
                discord_js_1.PermissionFlagsBits.Speak,
                discord_js_1.PermissionFlagsBits.Stream,
                discord_js_1.PermissionFlagsBits.UseVAD,
                discord_js_1.PermissionFlagsBits.Connect,
                discord_js_1.PermissionFlagsBits.ViewChannel,
                discord_js_1.PermissionFlagsBits.PrioritySpeaker,
                discord_js_1.PermissionFlagsBits.CreateInstantInvite
            ],
            deny: [
                discord_js_1.PermissionFlagsBits.MoveMembers,
                discord_js_1.PermissionFlagsBits.ManageRoles,
                discord_js_1.PermissionFlagsBits.ManageWebhooks,
                discord_js_1.PermissionFlagsBits.ManageChannels
            ]
        };
    }
    static async onRoomJoin(client, newState) {
        const { member, channel, guild } = newState;
        if (!member || !guild || !channel)
            return;
        const config = client.config.settings;
        if (!config)
            return;
        let creator = client.db.creators.find(creator => creator.voiceChannelId === channel.id);
        if (!creator)
            return;
        if (member.user.bot) {
            return member.voice.disconnect().catch(() => { });
        }
        const settings = await client.db.settings.dbGet(member.id);
        if (settings.leave > Date.now()) {
            return member.voice.disconnect().catch(() => { });
        }
        const name = client.util.resolveChannelName(config, member);
        if (member.voice.channelId !== creator.voiceChannelId)
            return;
        guild.channels.create({
            name: settings.name === '0' ? name : settings.name,
            userLimit: settings.userLimit,
            type: discord_js_1.ChannelType.GuildVoice,
            parent: creator.categoryId,
            permissionOverwrites: [
                {
                    id: member.id,
                    ...this.prototype.permissionsRoomOwner,
                    type: discord_js_1.OverwriteType.Member
                }
            ],
            reason: 'Создание приватной комнаты'
        }).then(async (channel) => {
            member?.voice?.setChannel(channel.id).then(async () => {
                settings.leave = Date.now();
                client.db.settings.dbSet(settings);
                client.db.rooms.dbSet({
                    voiceChannelId: channel.id,
                    ownerId: member.id,
                    cooldown: 0,
                });
            }).catch(async () => await channel.delete('Защита от ддоса приватных комнат').catch(() => { }));
        });
    }
    static async onRoomLeave(client, oldState) {
        const { member, channel, guild } = oldState;
        if (!member || !guild || !channel)
            return;
        const config = client.config.settings;
        if (!config)
            return;
        const room = await client.db.rooms.dbGet(channel.id);
        let creator = client.db.creators.find(creator => creator.voiceChannelId === channel.id || creator.categoryId === channel.parentId);
        if (!creator)
            return;
        if (!channel?.parent || channel.id === creator.voiceChannelId)
            return;
        if (channel.parent.id !== creator?.categoryId)
            return;
        if (channel.members.size === 0 && client.db.rooms.has(channel.id)) {
            await channel.delete('Выход из комнаты').catch(() => { });
            await client.db.rooms.dbDelete(channel.id);
        }
        if (room && room?.ownerId === member.id) {
            let settings = await client.db.settings.get(member.id);
            settings.leave = Math.round(Date.now() + client.config.cooldownVoiceJoin);
            await client.db.settings.dbSet(settings);
        }
    }
}
exports.default = VoiceManager;
