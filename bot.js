const Discord = require('discord.js');

const client = new Discord.Client();

 

client.on('ready', () => {

    console.log('I am ready!');

});

 

client.on('message', message => {

    if (message.content === 'ping') {

       message.reply('pong');

       }

});

 

// THIS  MUST  BE  THIS  WAY

client.login(process.env.NjE0MjM4ODU5Mjk0OTMyOTkz.XV8k1g.NlePTJR1f_Z0wTY2PylolEYrMRw);//BOT_TOKEN is the Client Secret
