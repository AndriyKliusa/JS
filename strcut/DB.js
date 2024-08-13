"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DB = void 0;
const discord_js_1 = require("discord.js");
const sqlite3_1 = __importDefault(require("sqlite3"));
const sqlite_1 = require("sqlite");
const discord_js_2 = require("discord.js");
const EmbedBuilder_1 = __importDefault(require("./utils/EmbedBuilder"));
class DB {
    constructor() {
    }
    async connect(client) {
        this.file = await (0, sqlite_1.open)({
            filename: `${__dirname}/../../DB.db`,
            driver: sqlite3_1.default.cached.Database
        });
        this.client = client;
        this.creators = new CreatorsManager(this, this.client);
        this.rooms = new RoomManager(this, this.client);
        this.settings = new SettingsManager(this, this.client);
        this.init();
    }
    async init() {
        try {
            let creators = await this.file.all('SELECT * FROM voiceCreators');
            creators.forEach((creator) => {
                this.creators.set(`${creator.guildId}.${creator.categoryId}`, creator);
            });
            this.client.on('ready', () => {
                creators.forEach((creator) => {
                    let voice = this.client.channels.cache.get(creator.voiceChannelId);
                    let text = this.client.channels.cache.get(creator.textChannelId);
                    let category = this.client.channels.cache.get(creator.categoryId);
                    if (!voice || !text || !category) {
                        this.creators.dbDelete(creator.guildId, creator.categoryId);
                    }
                });
            });
        }
        catch {
            this.file.run('CREATE TABLE voiceCreators (id INTEGER PRIMARY KEY AUTOINCREMENT, guildId TEXT, textChannelId TEXT, voiceChannelId TEXT, categoryId TEXT)');
        }
        try {
            let rooms = await this.file.all('SELECT * FROM rooms');
            rooms.forEach((room) => {
                this.rooms.set(room.voiceChannelId, room);
            });
        }
        catch {
            this.file.run('CREATE TABLE rooms (id INTEGER PRIMARY KEY AUTOINCREMENT, voiceChannelId TEXT, ownerId TEXT, cooldown INTEGER)');
        }
        try {
            let settings = await this.file.all('SELECT * FROM settings');
            settings.forEach((setting) => {
                this.settings.set(setting.userId, setting);
            });
        }
        catch {
            this.file.run('CREATE TABLE settings (id INTEGER PRIMARY KEY AUTOINCREMENT, guildId TEXT, userId TEXT, name TEXT, userLimit INTEGER, locked INTEGER, visible INTEGER, leave INTEGER)');
        }
    }
}
exports.DB = DB;
class CreatorsManager extends discord_js_2.Collection {
    constructor(db, client) {
        super();
        this.db = db;
        this.client = client;
    }
    async dbGet(guildId, categoryId) {
        let result = this.get(`${guildId}.${categoryId}`);
        if (!result) {
            result = await this.create(guildId);
            this.set(`${guildId}.${result.categoryId}`, result);
        }
        return result;
    }
    dbSet(guildId, creator) {
        let creatorDb = this.db.file.all('SELECT * FROM voiceCreators WHERE guildId = ? AND categoryId = ?', [creator.guildId, creator.categoryId])[0];
        if (!creatorDb) {
            this.db.file.run('INSERT INTO voiceCreators (guildId, textChannelId, voiceChannelId, categoryId) VALUES (?, ?, ?, ?)', [creator.guildId, creator.textChannelId, creator.voiceChannelId, creator.categoryId]);
        }
        else
            this.db.file.run('UPDATE voiceCreators SET textChannelId = ?, voiceChannelId = ?, categoryId = ? WHERE guildId = ?', [creator.textChannelId, creator.voiceChannelId, creator.categoryId, creator.guildId]);
        return this.set(guildId, creator);
    }
    dbDelete(guildId, categoryId) {
        let creator = this.get(`${guildId}.${categoryId}`);
        if (!creator)
            return;
        let text = this.client.channels.cache.get(creator.textChannelId);
        let voice = this.client.channels.cache.get(creator.voiceChannelId);
        let category = this.client.channels.cache.get(creator.categoryId);
        if (text)
            text.delete();
        if (voice)
            voice.delete();
        if (category)
            category.delete();
        this.db.file.run('DELETE FROM voiceCreators WHERE guildId = ? AND categoryId = ?', [guildId, categoryId]);
        return this.delete(`${guildId}.${categoryId}`);
    }
    async create(guildId) {
        let guild = this.client.guilds.cache.get(guildId);
        let category = await guild.channels.create({ name: 'Приватные каналы', type: discord_js_1.ChannelType.GuildCategory });
        let voiceChannel = await guild.channels.create({ name: 'Создать канал [+]', parent: category.id, type: discord_js_1.ChannelType.GuildVoice });
        let textChannel = await guild.channels.create({ name: 'инструкция', type: discord_js_1.ChannelType.GuildText, parent: category.id, permissionOverwrites: [{ id: guild.id, deny: [discord_js_1.PermissionFlagsBits.MentionEveryone, discord_js_1.PermissionFlagsBits.SendMessages, discord_js_1.PermissionFlagsBits.CreatePublicThreads, discord_js_1.PermissionFlagsBits.CreatePrivateThreads, discord_js_1.PermissionFlagsBits.ManageThreads] }] });
        let webhook = await textChannel.createWebhook({
            name: this.client.config.settings.webhook.name,
            avatar: `${__dirname}/../../assets/avatar.png`
        });
        let row1 = new discord_js_1.ActionRowBuilder(), row2 = new discord_js_1.ActionRowBuilder();
        let config = this.client.config.settings;
        for (let i = 0; Object.keys(config.buttons).length > i; i++) {
            if (i % 2 === 0) {
                row1.addComponents(new discord_js_1.ButtonBuilder().setCustomId(Object.keys(config.buttons)[i]).setEmoji(this.client.emojisStorage.cache.get(Object.keys(config.buttons)[i]).toString()).setStyle(config.style));
            }
            else {
                row2.addComponents(new discord_js_1.ButtonBuilder().setCustomId(Object.keys(config.buttons)[i]).setEmoji(this.client.emojisStorage.cache.get(Object.keys(config.buttons)[i]).toString()).setStyle(config.style));
            }
        }
        webhook.send({ embeds: [new EmbedBuilder_1.default().settingRoomEmbed(this.client)], components: [
                row1, row2
            ] });
        this.dbSet(`${guildId}.${category.id}`, {
            guildId: guildId,
            textChannelId: textChannel.id,
            voiceChannelId: voiceChannel.id,
            categoryId: category.id
        });
        return {
            guildId: guildId,
            textChannelId: textChannel.id,
            voiceChannelId: voiceChannel.id,
            categoryId: category.id
        };
    }
}
class RoomManager extends discord_js_2.Collection {
    constructor(db, client) {
        super();
        this.db = db;
        this.client = client;
    }
    async dbGet(voiceChannelId) {
        let result = this.get(`${voiceChannelId}`);
        return result;
    }
    async dbSet(room) {
        let roomDb = this.get(room.voiceChannelId);
        if (!roomDb)
            roomDb = await this.db.file.all('SELECT * FROM rooms WHERE voiceChannelId = ?', [room.voiceChannelId])[0];
        if (!roomDb) {
            roomDb = room;
            this.db.file.run('INSERT INTO rooms (voiceChannelId, ownerId, cooldown) VALUES (?, ?, ?)', [room.voiceChannelId, room.ownerId, room.cooldown]);
        }
        else {
            if (roomDb.ownerId !== room.ownerId || roomDb.cooldown !== room.cooldown)
                this.db.file.run(`UPDATE rooms SET 
            ${roomDb.ownerId !== room.ownerId ? `ownerId = ${room.ownerId}` : ''}
            ${roomDb.cooldown !== room.cooldown ? `cooldown = ${room.cooldown}` : ''}
            WHERE voiceChannelId = ?`, [room.voiceChannelId]);
        }
        return this.set(`${room.voiceChannelId}`, room);
    }
    dbDelete(voiceChannelId) {
        let room = this.client.channels.cache.get(voiceChannelId);
        if (room)
            room.delete();
        this.db.file.run('DELETE FROM rooms WHERE voiceChannelId = ?', [voiceChannelId]);
        return this.delete(`${voiceChannelId}`);
    }
}
class SettingsManager extends discord_js_2.Collection {
    constructor(db, client) {
        super();
        this.db = db;
        this.client = client;
    }
    async dbGet(userId) {
        let result = this.get(`${userId}`);
        if (!result) {
            result = {
                userId: userId,
                name: '0',
                userLimit: 0,
                locked: 0,
                visible: 0,
                leave: 0
            };
            this.set(`${userId}`, result);
            this.db.file.run('INSERT INTO settings (userId, name, userLimit, locked, visible) VALUES (?, ?, ?, ?, ?)', [result.userId, result.name, result.userLimit, result.locked, result.visible]);
        }
        return result;
    }
    async dbSet(setting) {
        let settingDb = this.get(setting.userId);
        if (!settingDb)
            settingDb = await this.db.file.all('SELECT * FROM settings WHERE userId = ?', [setting.userId])[0];
        if (!settingDb) {
            settingDb = setting;
            this.db.file.run('INSERT INTO settings (userId, name, userLimit, locked, visible) VALUES (?, ?, ?, ?, ?, ?)', [setting.userId, setting.name, setting.userLimit, setting.locked, setting.visible]);
        }
        else {
            if (settingDb.name !== setting.name || settingDb.userLimit !== setting.userLimit || settingDb.locked !== setting.locked || settingDb.visible !== setting.visible)
                this.db.file.run(`UPDATE settings SET 
            ${settingDb.name !== setting.name ? `name = ${setting.name}` : ''}
            ${settingDb.userLimit !== setting.userLimit ? `userLimit = ${setting.userLimit}` : ''}
            ${settingDb.locked !== setting.locked ? `locked = ${setting.locked}` : ''}
            ${settingDb.visible !== setting.visible ? `visible = ${setting.visible}` : ''}
            WHERE userId = ?`, [setting.userId]);
        }
        return this.set(`${setting.userId}`, setting);
    }
    dbDelete(guildId, userId) {
        this.db.file.run('DELETE FROM settings WHERE userId = ?', [userId]);
        return this.delete(`${userId}`);
    }
}
let db = new DB();
exports.default = db;
