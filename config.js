"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settings = exports.cooldownVoiceJoin = exports.intents = exports.internal = void 0;
const discord_js_1 = require("discord.js");
exports.internal = {
    token: '', // Токен бота (https://discord.com/developers/applications)
};
exports.intents = 1; // Все интенты
exports.cooldownVoiceJoin = 1000; // Задержка на вход в голосовой канал (в миллисекундах)
exports.settings = {
    webhook: {
        name: 'Voice Manager' // Имя вебхука
    },
    defaultName: '⭐ {username}',
    color: 0x2f3136,
    style: discord_js_1.ButtonStyle.Secondary,
    buttons: {
        'rename': {
            title: 'Изменить название'
        },
        'limit': {
            title: 'Изменить лимит'
        },
        'close': {
            title: 'Закрыть/открыть'
        },
        'hide': {
            title: 'Скрыть/показать'
        },
        'user': {
            title: 'Бан/разбан'
        },
        'speak': {
            title: 'Мут/размут'
        },
        'kick': {
            title: 'Выгнать пользователя'
        },
        // 'reset': {
        //     title: 'Сбросить права пользователю'
        // },
        'owner': {
            title: 'Передать права'
        },
        // 'info': {
        //     title: 'Информация о комнате'
        // }
    },
    placeholder: {
        user: '🔷 Выберите пользователя',
        channel: '🔷 Выберите приватную комнату'
    },
    line: true,
    dot: false,
    debug: false // Отладка (сейчас она не стоит, чтобы её поставить впишите "true" вместо "false")
};
