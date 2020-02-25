// Global Variables 

const Discord = require('discord.js');
var Child_process = require('child_process');
const client = new Discord.Client({disableEveryone: false});

// Global Variables - State of Bot

let lastGiveAway = null;
let ChannelLiveID = "453256711935885314";
let ChannelLigueID = "665954885879201792";
let ChannelTestID = "614263675947188231";
let ChannelOnLive = {"Chouchougeekart": 1, "Dovvzie": 1, "geof2810": 1,"liguecosplay": 1};

// Functions

function sendCUrlRequest(type, target, channelID, iter = 0){
	var url = null;
	var typeFound = false;
	let stream_url = "https://api.twitch.tv/helix/streams?user_login="+target;
	Child_process.exec("curl -H 'Client-ID: njy5v2njcv4492dsi7xtr80myninob' -X GET '"+stream_url+"'", function (error, stdout, stderr) {
		if(stdout === '{"data":[],"pagination":{}}'){
			if(iter <= 120){
				console.log("Streaming of "+ target + " unreachable... Retry in 10 seconds ...");
				setTimeout(function(){sendCUrlRequest(type, target, channelID, iter + 1);}, 10000);
			}
		}
		else{
			console.log(stdout);
			let StreamInfo = JSON.parse(stdout);
			let userStreaming = StreamInfo["data"][0]
			let channelLive = client.channels.get(channelID);
			let message = userStreaming["user_name"]+" est en live ! @everyone \nhttps://twitch.tv/"+userStreaming["user_name"];
			if(userStreaming["game_id"]){
				let game_url = "https://api.twitch.tv/helix/games?id="+userStreaming["game_id"];
				Child_process.exec("curl -H 'Client-ID: njy5v2njcv4492dsi7xtr80myninob' -X GET '"+game_url+"'", function (error, stdout, stderr) {
					let game_info = JSON.parse(stdout);
					let thumbnail = userStreaming["thumbnail_url"].replace(/{width}/, "356");
					thumbnail = thumbnail.replace(/{height}/, "200");
					let game_played = game_info["data"][0]["box_art_url"].replace(/{width}/, "60");
					game_played = game_played.replace(/{height}/, "80");
					let embeddedInfo = new Discord.RichEmbed()
					.setTitle(userStreaming["user_name"]+" est en LIVE !")
					.setDescription(userStreaming["title"])
					.setThumbnail(game_played)
					.setColor(0x02d414)
					.addField('En live sur', game_info["data"][0]["name"], true)
					.setImage(thumbnail)
					.setTimestamp(userStreaming["timestamp"])
					.setFooter("twitch.tv/"+userStreaming["user_name"]);
					channelLive.send(message,{"embed": embeddedInfo});
					console.log("Twitch stream detected");
				});
			}
			else{
				let thumbnail = userStreaming["thumbnail_url"].replace(/{width}/, "356");
				thumbnail = thumbnail.replace(/{height}/, "200");
				let embeddedInfo = new Discord.RichEmbed()
					.setTitle(userStreaming["user_name"]+" est en LIVE !")
					.setDescription(userStreaming["title"])
					.setImage(thumbnail)
					.setColor(0x02d414)
					.setTimestamp(userStreaming["timestamp"])
					.setFooter("twitch.tv/"+userStreaming["user_name"]);
				channelLive.send(message,{"embed": embeddedInfo});
				console.log("Twitch stream without category detected");
			}
		}		
	});
}

function sendCUrlRequestAlways(type, target, channelID){
	var url = null;
	var typeFound = false;
	let stream_url = "https://api.twitch.tv/helix/streams?user_login="+target;
	Child_process.exec("curl -H 'Client-ID: njy5v2njcv4492dsi7xtr80myninob' -X GET '"+stream_url+"'", function (error, stdout, stderr) {
		if(stdout === '{"data":[],"pagination":{}}'){
			console.log("Streaming of "+ target + " unreachable... Retry in 10 seconds ...");
			ChannelOnLive[target] = 0;
		}
		else{
			if(ChannelOnLive[target] == 0){
				console.log(stdout);
				ChannelOnLive[target] = 1;
				let StreamInfo = JSON.parse(stdout);
				let userStreaming = StreamInfo["data"][0]
				let channelLive = client.channels.get(channelID);
				let message = userStreaming["user_name"]+" est en live ! @everyone \nhttps://twitch.tv/"+userStreaming["user_name"];
				if(userStreaming["game_id"]){
					let game_url = "https://api.twitch.tv/helix/games?id="+userStreaming["game_id"];
					Child_process.exec("curl -H 'Client-ID: njy5v2njcv4492dsi7xtr80myninob' -X GET '"+game_url+"'", function (error, stdout, stderr) {
						let game_info = JSON.parse(stdout);
						let thumbnail = userStreaming["thumbnail_url"].replace(/{width}/, "356");
						thumbnail = thumbnail.replace(/{height}/, "200");
						let game_played = game_info["data"][0]["box_art_url"].replace(/{width}/, "60");
						game_played = game_played.replace(/{height}/, "80");
						let embeddedInfo = new Discord.RichEmbed()
						.setTitle(userStreaming["user_name"]+" est en LIVE !")
						.setDescription(userStreaming["title"])
						.setThumbnail(game_played)
						.setColor(0x02d414)
						.addField('En live sur', game_info["data"][0]["name"], true)
						.setImage(thumbnail)
						.setTimestamp(userStreaming["timestamp"])
						.setFooter("twitch.tv/"+userStreaming["user_name"]);
						channelLive.send(message,{"embed": embeddedInfo});
						console.log("Twitch stream detected");
					});
				}
				else{
					let thumbnail = userStreaming["thumbnail_url"].replace(/{width}/, "356");
					thumbnail = thumbnail.replace(/{height}/, "200");
					let embeddedInfo = new Discord.RichEmbed()
						.setTitle(userStreaming["user_name"]+" est en LIVE !")
						.setDescription(userStreaming["title"])
						.setImage(thumbnail)
						.setColor(0x02d414)
						.setTimestamp(userStreaming["timestamp"])
						.setFooter("twitch.tv/"+userStreaming["user_name"]);
					channelLive.send(message,{"embed": embeddedInfo});
					console.log("Twitch stream without category detected");
				}
			}
		}		
	});
}

// Event Manager

client.on('ready', () => {
    console.log('I am ready!');
	//setInterval(function(){sendCUrlRequestAlways('getStreamInfo', 'geof2810', ChannelTestID);}, 10000);
	setInterval(function(){sendCUrlRequestAlways('getStreamInfo', 'Dovvzie', ChannelLiveID);}, 10000);
	setInterval(function(){sendCUrlRequestAlways('getStreamInfo', 'Chouchougeekart', ChannelLiveID);}, 10000);
	setInterval(function(){sendCUrlRequestAlways('getStreamInfo', 'liguecosplay', ChannelLigueID);}, 10000);
});


client.on('message', message => {
 if(!(message.author.bot)){

	let d = new Date();
	let currTimeStamp = d.getTime();
	 
    if (message.content === '!help'){
       message.reply('Voici les differentes commandes disponibles : \n !ping \n !tipeee \n !chouchou \n !dowzie \n et d\'autres plus secrètes :wink:');
    }
	 
    // Test Commands
	if (message.content === '!testStream') {
		StreamInfo = sendCUrlRequest('getStreamInfo', 'geof2810', ChannelTestID);
	}

 
    // Fun Commands
    /*if (message.content === '!ping') {
       message.reply('pong');
    }*/
    /*if (message.content.toLowerCase().includes('dovvzie', 0)){
        message.channel.send('<@194524212134674432> c\'est un gros caca !');
        message.channel.send('<@253491625328771073> AUSSI !');
    }*/
    if (message.content.toLowerCase().includes('faute de jezal',0)){
      message.reply('Tut tut tut ! Comme inscrit dans la constitution, c\'est la faute A Jezal !');
    }
  
    if (message.content.toLowerCase().includes('prout', 0)){
        message.reply('C\'est toi le prout !');
    }
    if (message.content.toLowerCase().includes('pizza', 0) && message.content.toLowerCase().includes('ananas')){
        message.channel.send('J\'ai entendu Pizza et Ananas dans la même phrase, j\'espere que vous ne mangez pas ca ! \n https://tenor.com/view/ew-disgust-gif-3671501');
    }
	if (message.content.toLowerCase().includes('nutella', 0)){
        message.reply({files: ['./nutella.gif']});
    }
    if (message.content.toLowerCase().includes('giveaway', 0) && currTimeStamp - lastGiveAway > 14400000){
		message.channel.send('Comment ?! J\'ai entendu giveaway ? je préviens tout de suite <@253491625328771073> !');
		lastGiveAway = d.getTime();
    }
 
    // Info Commands
 
    if (message.content === '!tipeee'){
       message.reply('Go me support sur Tipeee si tu aime mon job, plein de trucs cool en contrepartie :wink: \nhttps://fr.tipeee.com/dowzie');
    }
    if (message.content === '!chouchou'){
       message.reply('Go follow pour ne rien rater ! \n:dagger:  Facebook : <https://www.facebook.com/Chouchougeekart> \n \
:dagger:  Twitter : <https://twitter.com/ChouchouGeekArt> \n:dagger:  Instagram : <https://www.instagram.com/chouchougeekart> \n:dagger:  Twitch : <https://www.twitch.tv/chouchougeekart> \n:dagger:  Site internet : <https://chouchougeekart.blogspot.com> \n:dagger:  Youtube : <https://www.youtube.com/channel/UC4YWjAguofYoh29b6rBTwCw/featured>');
    }
    if (message.content === '!dowzie'){
       message.reply('Go follow pour ne rien rater ! \n:pushpin:  Facebook : <https://www.facebook.com/DowzieCosplay> \n \
:pushpin:  Twitter : <https://twitter.com/dovvzie> \n:pushpin:  Instagram : <https://www.instagram.com/dovvzie> \n:pushpin:  Twitch : <https://www.twitch.tv/dovvzie> \n:pushpin:  Tipeee : <https://fr.tipeee.com/dowzie>');
    }
	 
	if (message.content === "!hipster"){
		message.channel.send("On m'a appelé ?");
		message.channel.send({files: ['./loreal.gif']});
	}
	
	if (message.content === "!hipsterdab"){
		message.channel.send({files: ['./hipsterdabv2.gif']});
	}
 }
 

});

/*client.on('presenceUpdate', (oldMember, newMember) => {
	// Annonce Dowzie & Chouchou
    if (!oldMember.presence.game && newMember.presence.game && newMember.presence.game.streaming && newMember.guild.id === '453232787944767498'){
	    if(newMember.id === '194524212134674432'){
		    StreamInfo = sendCUrlRequest('getStreamInfo', 'Dovvzie', ChannelLiveID);
	    }
	    if(newMember.id === '283740549448597505'){
		    StreamInfo = sendCUrlRequest('getStreamInfo', 'Chouchougeekart', ChannelLiveID);
	    } 
    }
	// Test Geof
	if (!oldMember.presence.game && newMember.presence.game && newMember.presence.game.streaming && newMember.id === '253491625328771073' && newMember.guild.id === '453232787944767498'){
		StreamInfo = sendCUrlRequest('getStreamInfo', 'geof2810', ChannelTestID);
    }
});*/



 

// THIS  MUST  BE  THIS  WAY

client.login(process.env.BOT_TOKEN);//BOT_TOKEN is the Client Secret
