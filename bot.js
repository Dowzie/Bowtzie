const Discord = require('discord.js');

const client = new Discord.Client();

 

client.on('ready', () => {

    console.log('I am ready!');

});

 

client.on('message', message => {
 

    if (message.content === '!tipeee') {

       message.reply('Go me support sur Tipeee si tu aime mon job, plein de trucs cool en contrepartie ;) https://fr.tipeee.com/dowzie')
     
           if (message.content === '!chouchou') {

       message.reply('N'hésite pas à follow Chouchou sur les réseaux : 
Facebook : https://www.facebook.com/Chouchougeekart
Twitter : https://twitter.com/ChouchouGeekArt
Instagram : https://www.instagram.com/chouchougeekart
Twitch : https://www.twitch.tv/chouchougeekart
Site internet : https://chouchougeekart.blogspot.com/
Youtube : https://www.youtube.com/channel/UC4YWjAguofYoh29b6rBTwCw/             ')
                     
      if (message.content === '!dowzie') {

       message.reply('N'hésite pas à follow Dowzie sur les réseaux : 
Facebook : https://www.facebook.com/DowzieCosplay
Twitter : https://twitter.com/dovvzie
Instagram :  https://www.instagram.com/dovvzie
Twitch: https://www.twitch.tv/dovvzie
Tipeee: https://fr.tipeee.com/dowzie             ')
    
      if (message.content === '!print') {

       message.reply('Prints cosplay disponibles : https://forms.gle/KcaZNGCHivGCw4x89');
      
     
    

       }

});

 

// THIS  MUST  BE  THIS  WAY

client.login(process.env.BOT_TOKEN);//BOT_TOKEN is the Client Secret
