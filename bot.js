'use strict'
 
 
const config = require("./config.js");
const Config = require('config-js');
const SteamUser = require('steam-user');
const SteamTotp = require('steam-totp');
const SteamCommunity = require('steamcommunity');
const TradeofferManager = require('steam-tradeoffer-manager');
const client = new SteamUser();
const community = new SteamCommunity();
const manager = new TradeofferManager({
        steam: client,
        community: community,
        language: 'en' // Может быть любой язык
});
 
// Вход в аккаунт с использованием config.js
 
const logOnOptions = {
    "accountName": config.steam.username,
    "password": config.steam.password,
    "twoFactorCode": SteamTotp.generateAuthCode(config.steam.twoFactorCode)
};
 
client.logOn(logOnOptions);
 
// События которые происходят при успешном логине бота
 
client.on('loggedOn', () => {
        console.log('[!]Бот авторизовался!');
    
        client.setPersona(SteamUser.EPersonaState.Online, config.steam.botname);
        //client.gamesPlayed(730);
 
        //console.log('[!]Бот сейчас играет в CS:GO');
});
 
// Функция проверки трейдов
 
client.on('webSession', (sessionid, cookies) => {
        manager.setCookies(cookies);
 
        community.setCookies(cookies);
        community.startConfirmationChecker(config.steam.refreshInterval, config.steam.identity_secret);
});
 
// Если кто-то добавил бота
 
client.on('friendRelationship', (steamid, relationship) => {
    if (relationship === 2) {
        console.log('[!]Кто-то добавил бота!'); 
    }
});
 
// Принятие/отклонение трейдов
 
manager.on('newOffer', (offer) => {
    if (offer.itemsToGive.length === 0) {
        offer.accept((err, status) => {
            if (err) {
                console.log(err);
            } else {
                console.log(`[!]Трейд принят! Статус: ${status}.`);
 
            }
        });
    } else {
        offer.decline((err) => {
            if (err) {
                console.log(err);
            } else {
                console.log(`[!]Трейд отклонён! (Попытка вывода предметов бота).`)
            }
        });
        
     }
});