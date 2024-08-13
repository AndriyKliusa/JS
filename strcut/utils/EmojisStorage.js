"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const fs_1 = __importStar(require("fs"));
const md5_1 = __importDefault(require("md5"));
const events_1 = __importDefault(require("events"));
class EmojiStorage extends events_1.default {
    constructor(client, options = { guildscount: 1 }) {
        super();
        this.options = options;
        this.cache = new discord_js_1.Collection();
        this.md5Map = new discord_js_1.Collection();
        this.dir = `${__dirname}/../../../assets/emojis`;
        this.changed = false;
        this.md5RematchQuery = new Set();
        this.createQuery = new Set();
        this.lastUpdate = 0;
        this.waitForUpdate = false;
        this.client = client;
        this.guilds = new discord_js_1.Collection();
    }
    async checkGuilds() {
        let count = 0;
        let regexp = new RegExp(/^emojiStorage(\d|\d\d)$/);
        let guilds = this.client.guilds.cache.filter(guild => guild?.name.match(regexp)).map(g => g);
        for (let i = 0; i < guilds.length; i++) {
            let guild = guilds[i];
            let invite = (await guild.channels.cache.last().fetchInvites()).first() ||
                await guild.channels.cache.find(c => c.type === discord_js_1.ChannelType.GuildText).createInvite({ maxAge: 0, maxUses: 0, unique: true, reason: 'EmojiStorage' });
            console.log(`STORAGE >>> Invite for ${guild.name}: ${invite.url}`);
            let owner = await guild.fetchOwner();
            if (owner.id === this.client.user.id) {
                count++;
                await guild.emojis.fetch();
                this.guilds.set(guild.id, guild);
            }
        }
        if (count < this.options.guildscount) {
            await this.createGuilds(this.options.guildscount - count);
        }
    }
    async createGuilds(count) {
        for (let i = 0; i < count; i++) {
            await this.createGuild(i);
        }
        ;
    }
    async createGuild(number) {
        let name = `emojiStorage${number}`;
        console.log(`STORAGE >>> Creating server ${name}...`);
        let guild = await this.client.guilds.create({
            name
        });
        this.guilds.set(guild.id, guild);
        console.log(`STORAGE >>> Server ${name} created`);
    }
    async checkEmojisLoop() {
        let md5RematchQuerycopy = Array.from(this.md5RematchQuery);
        let createQuerycopy = Array.from(this.createQuery);
        let changedcopy = this.changed;
        this.changed = false;
        this.md5RematchQuery = new Set();
        this.createQuery = new Set();
        for (let i = 0; i < md5RematchQuerycopy.length; i++) {
            let item = md5RematchQuerycopy[i];
            let last = this.md5Map.findKey((i) => i === item.split('.')[0]);
            try {
                fs_1.default.accessSync(`${this.dir}/${item}`, fs_1.default.constants.F_OK);
                let fileContent = (0, fs_1.readFileSync)(`${this.dir}/${item}`);
                let md5File = (0, md5_1.default)(fileContent);
                if (last !== md5File) {
                    this.md5Map.set(md5File, item.split('.')[0]);
                    this.md5Map.delete(last);
                }
            }
            catch (e) { }
        }
        if (changedcopy) {
            let files = (0, fs_1.readdirSync)(this.dir);
            await this.checkEmojisInCache(files);
            await this.checkEmojisInServer(files);
        }
        if (createQuerycopy.length > 0) {
            for (let i = 0; i < createQuerycopy.length; i++) {
                let item = createQuerycopy[i];
                await this.createEmoji(item);
            }
            this.emit('change');
            this.client.emit('emojiStorageUpdate');
        }
        await sleep(1000);
        this.checkEmojisLoop();
    }
    async init() {
        await this.checkGuilds();
        console.log(`STORAGE >>> Loading emojis...`);
        await this.checkEmojis();
        console.log(`STORAGE >>> Emojis loaded`);
        this.checkEmojisLoop();
        (0, fs_1.watch)(this.dir, (eventType, filename) => {
            if (!['change', 'rename'].includes(eventType))
                return;
            this.md5RematchQuery.add(filename);
            try {
                let filePath = this.dir + '/' + filename;
                let name = filename.split('.')[0];
                fs_1.default.access(filePath, fs_1.default.constants.F_OK, async (err) => {
                    if (err) {
                        this.changed = true;
                        return;
                    }
                    if (!this.cache.has(name)) {
                        this.createQuery.add(filename);
                    }
                    else {
                        this.changed = true;
                        this.createQuery.add(filename);
                    }
                });
            }
            catch (e) { }
        });
        this.emit('ready');
    }
    getEmoji(search) {
        return this.cache.get(search)?.toString();
    }
    async checkEmojis() {
        await this.checkMd5();
        const guilds = this.guilds.map(g => g);
        for (let i = 0; guilds.length > i; i++) {
            const emojis = guilds[i].emojis.cache.map(e => e);
            for (let a = 0; emojis.length > a; a++) {
                const emoji = emojis[a];
                if (!this.cache.has(this.md5Map.get(emoji.name))) {
                    this.cache.set(this.md5Map.get(emoji.name), emoji);
                }
                else {
                    await this.deleteEmoji(emoji);
                }
            }
        }
        (0, fs_1.readdir)(this.dir, async (err, files) => {
            if (err)
                throw err;
            await this.checkEmojisInCache(files);
            await this.checkEmojisInServer(files);
        });
    }
    async checkMd5() {
        let files = (0, fs_1.readdirSync)(this.dir);
        files.filter(f => f.endsWith('.png') || f.endsWith('.gif') || f.endsWith('jpg'));
        for (let i = 0; i < files.length; i++) {
            let file = files[i];
            let fileContent = (0, fs_1.readFileSync)(`${this.dir}/${file}`);
            this.md5Map.set((0, md5_1.default)(fileContent), file.split('.')[0]);
        }
    }
    async checkEmojisInCache(files) {
        let arr = files.filter(f => f.endsWith('.png') || f.endsWith('.gif') || f.endsWith('jpg'));
        for (let i = 0; i < arr.length; i++) {
            let file = arr[i];
            if (!this.cache.has(file.split('.')[0])) {
                await this.createEmoji(file);
            }
        }
    }
    async checkEmojisInServer(files) {
        let emojis = this.cache.filter(f => !files.find(file => {
            let hash = this.md5Map.findKey((item) => item === file.split('.')[0]);
            return hash && hash === f.name;
        })).map(e => e);
        for (let i = 0; i < emojis.length; i++) {
            await this.deleteEmoji(emojis[i], true);
        }
    }
    async createEmoji(file) {
        if (!['png', 'jpg', 'gif'].includes(file.split('.')[1]))
            return;
        const guild = await this.getGuildWithEmojiSlot(file.endsWith('.gif'));
        if (!guild)
            return console.log(`STORAGE >>> Could not find guild with emoji slot`);
        let fileContent = (0, fs_1.readFileSync)(`${this.dir}/${file}`);
        let md5content = (0, md5_1.default)(fileContent);
        let guilds = this.guilds.map(a => a);
        for (let i = 0; i < guilds.length; i++) {
            let emoji = guilds[i].emojis.cache.find(emoji => emoji.name === md5content);
            if (emoji) {
                this.cache.set(file.split('.')[0], emoji);
                return;
            }
        }
        const emoji = await guild.emojis.create({
            name: md5content,
            attachment: (this.dir + '/' + file)
        });
        await guild.emojis.fetch();
        this.cache.set(file.split('.')[0], emoji);
        console.log(`STORAGE >>> Emoji ${emoji.name} created in ${guild.name}`);
        this.emit('emojiCreate', file.split('.')[0], emoji);
    }
    async deleteEmoji(emoji, cache = false) {
        console.log(`STORAGE >>> Emoji ${emoji.name} deleted in ${emoji.guild.name}`);
        if (emoji.deletable) {
            await emoji.delete().catch(() => { });
        }
        if (this.cache.has(this.md5Map.get(emoji.name)) && cache) {
            this.cache.delete(this.md5Map.get(emoji.name));
        }
    }
    async getGuildWithEmojiSlot(animated) {
        const guilds = this.guilds.map(g => g);
        for (let i = 0; i < guilds.length; i++) {
            let g = guilds[i];
            let emojis = g.emojis.cache;
            if (animated) {
                emojis = g.emojis.cache.filter(e => e.animated);
            }
            if (emojis.size < 50)
                return g;
        }
    }
}
exports.default = EmojiStorage;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
