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
        "steam": client,
        "community": community,
        "language": 'en' // Может быть любой язык
});
 
//login account using config.js
 
const logOnOptions = {
    "accountName": config.steam.username, //get login
    "password": config.steam.password,	 //get password
    "twoFactorCode": SteamTotp.generateAuthCode(config.steam.twoFactorCode) //get two factor code
};
 
client.logOn(logOnOptions);
 
//Events that upon successful login of the bot 
 
client.on('loggedOn', () => { //Login account or exit
        console.log('[!]Бот авторизовался!'); //Message: Bot logged!
    
        client.setPersona(SteamUser.EPersonaState.Online, config.steam.botname); //changes status profile and changer status profile online
        //client.gamesPlayed(730); //endered in game bot 730 -> CSGO
});
 
//function trade verification
 
client.on('webSession', (sessionid, cookies) => { //Emitted when a steamcommunity.com web session is successfully negotiated.
        manager.setCookies(cookies); //
 
        community.setCookies(cookies);
        community.startConfirmationChecker(config.steam.refreshInterval, config.steam.identity_secret);
});
 
//If other user add bot in friends
 
client.on('friendRelationship', (steamid, relationship) => {
    if (relationship === 2) { // if new freinds
        console.log('[!]Кто-то добавил бота!'); //Message: Some-one add bot! 
    }
});
 
//Adoption/Deviation trades
 
manager.on('newOffer', (offer) => {
    if (offer.itemsToGive.length === 0) { //If other users don't want receive your items 
        offer.accept((err, status) => { //Accept trade
            if (err) {
                console.log(err);
            } else {
                console.log(`[!]Трейд принят! Статус: ${status}.`); //Message: Trade accept!
 
            }
        });
    } else {
        offer.decline((err) => { //Rejected trade
            if (err) { 
                console.log(err);
            } else {
                console.log(`[!]Трейд отклонён! (Попытка вывода предметов бота).`) //Message: Trade rejected!
            }
        });
     }
});

//Adoption trades

client.on('webSession', function(sessionID, cookies) {
	manager.setCookies(cookies, function(err) {
		if (err) {
			console.log(err);
			process.exit(1); // Fatal error since we couldn't get our API key
			return;
		}

		console.log("Got API key: " + manager.apiKey);

		// Get our inventory
		manager.getInventoryContents(730, 2, true, function(err, inventory) {
			if (err) {
				console.log(err);
				return;
			}

			if (inventory.length == 0) {
				// Inventory empty
				console.log("CS:GO inventory is empty");
				return;
			}

			console.log("Found " + inventory.length + " CS:GO items");

			// Create and send the offer
			let offer = manager.createOffer("https://steamcommunity.com/tradeoffer/new/?partner=348429648&token=5aT_OQuM");
			offer.addMyItems(inventory);
			offer.setMessage("Here, have some items!");
			offer.send(function(err, status) {
				if (err) {
					console.log(err);
					return;
				}

				if (status == 'pending') {
					// We need to confirm it
					console.log(`Offer #${offer.id} sent, but requires confirmation`);
					community.acceptConfirmationForObject("identitySecret", offer.id, function(err) {
						if (err) {
							console.log(err);
						} else {
							console.log("Offer confirmed");
						}
					});
				} else {
					console.log(`Offer #${offer.id} sent successfully`);
				}
                
			});
		});
	});

	community.setCookies(cookies);
});