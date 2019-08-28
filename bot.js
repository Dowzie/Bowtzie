const Discord = require('discord.js');

const client = new Discord.Client();

 

client.on('ready', () => {

    console.log('I am ready!');

});


client.on('message', message => {

    if (message.content === '!ping') {
       message.reply('pong');
    }
    if (message.content === '!tipeee'){
       message.reply('Test tipeee');
    }
    if (message.content.includes('prout', 0) && !(message.content.includes('Bowtzie', 0))) {
        message.reply('C\'est toi le prout !');
    }

});

 

// THIS  MUST  BE  THIS  WAY

client.login(process.env.BOT_TOKEN);//BOT_TOKEN is the Client Secret
