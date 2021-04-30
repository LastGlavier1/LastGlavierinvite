
const Discord = require('discord.js');
const prefix = process.env.PREFIX;
const ayarlar = require("../ayarlar.json");

module.exports = client => {
client.user.setActivity(ayarlar.botdurum, {type: 'WATCHING'}); 

}