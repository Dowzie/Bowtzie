const Discord = require('discord.js');

const client = new Discord.Client();

 

client.on('ready', () => {

    console.log('I am ready!');

});

 

client.on('message', message => {

    if (message.content === '!tipeee') {

       message.reply('Go me support sur Tipeee si tu aime mon job, plein de trucs cool en contrepartie ;) https://fr.tipeee.com/dowzie');

       }

});

 

// THIS  MUST  BE  THIS  WAY

client.login(process.env.BOT_TOKEN);//BOT_TOKEN is the Client Secret
