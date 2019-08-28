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
       message.reply('Go me support sur Tipeee si tu aime mon job, plein de trucs cool en contrepartie :wink: \nhttps://fr.tipeee.com/dowzie');
    }
  if (message.content === '!chouchou'){
       message.reply('Go follow pour ne rien rater ! \n:dagger:  Facebook : https://www.facebook.com/Chouchougeekart \n \
:dagger:  Twitter : https://twitter.com/ChouchouGeekArt \n:dagger:  Instagram : https://www.instagram.com/chouchougeekart \n:dagger:  Twitch : https://www.twitch.tv/chouchougeekart \n:dagger:  Site internet : https://chouchougeekart.blogspot.com \n:dagger:  Youtube : https://www.youtube.com/channel/UC4YWjAguofYoh29b6rBTwCw/featured');
    }
    if (message.content.toLowerCase().includes('prout', 0) && !(message.author.bot)){
        message.reply('C\'est toi le prout !');
    }
});

 

// THIS  MUST  BE  THIS  WAY

client.login(process.env.BOT_TOKEN);//BOT_TOKEN is the Client Secret
