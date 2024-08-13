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
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const fs_1 = __importStar(require("fs"));
class AvatarUpdater {
    constructor(client) {
        this.md5Map = new discord_js_1.Collection();
        this.dir = `${__dirname}/../../../assets`;
        this.client = client;
        let last = 0;
        (0, fs_1.watch)(this.dir, (eventType, filename) => {
            if (filename !== 'avatar.png')
                return;
            let changed = false;
            if (!['change', 'rename'].includes(eventType))
                return;
            try {
                let filePath = this.dir + '/' + filename;
                fs_1.default.access(filePath, fs_1.default.constants.F_OK, async (err) => {
                    if (!err)
                        if (last + 1000 > Date.now())
                            return;
                    setTimeout(() => {
                        this.client.emit('emojiStorageUpdate');
                    }, 1000);
                    last = Date.now();
                });
            }
            catch (e) { }
        });
    }
}
exports.default = AvatarUpdater;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
