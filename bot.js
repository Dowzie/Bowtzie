// Global Variables 

const Discord = require('discord.js');
const https = require('https');
var Child_process = require('child_process');
const client = new Discord.Client({disableEveryone: false});

// Global Variables - State of Bot

// >> Twitch Variables
let access_token = null;
let refresh_token = null;
let expires_token = null;

// >> Discord Variables
let lastGiveAway = null;
let ChannelLiveID = "453256711935885314";
let ChannelLigueID = "695943025855037440";
let ChannelTestID = "614263675947188231";
let ChannelOnLive = {"Chouchougeekart": 1, "Dovvzie": 1, "geof2810": 1,"liguecosplay": 1};

// Functions

function twitch_validation(){
	return new Promise((resolve, reject) => {
		if(access_token === null){
			resolve("token_null")
		}
		else {
			const options = {
				hostname: 'id.twitch.tv', port: 443,
				path: '/oauth2/validate', method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'OAuth ' + access_token
				}
			}

			const req = https.get(options, (res) => {
				if (res.statusCode !== 200) {
					console.log(res.statusCode)
					reject("token_outdated")
				}

				res.on('data', (d) => {
					process.stdout.write(d)
					resolve("token_valid")
				})
			})

			req.on('error', (e) => {
				console.error(e)
			})
		}
	})
}

function twitch_authentication(){
	return new Promise((resolve, reject) => {
		const options = {
			hostname: 'id.twitch.tv',
			port: 443,
			path: '/oauth2/token',
			method: 'POST',
			headers: {'Content-Type': 'application/json'}
		}

		const data = JSON.stringify({
			client_id: process.env.CLIENT_ID,
			client_secret: process.env.CLIENT_SECRET,
			grant_type: "client_credentials"
		});

		const req = https.request(options, (res) => {
			if(res.statusCode !== 200){
				console.log('statusCode :'+res.statusCode)
				reject()
			}

			res.on('data', d => {
				let data_result = JSON.parse(d)
				access_token = data_result["access_token"]
				refresh_token = data_result["refresh_token"]
				expires_token = data_result["expires_in"]
				process.stdout.write(d)
				resolve("access_token_granted")
			})
		});

		req.on('error', error => {console.error(error);reject()})

		req.write(data);
		req.end();
	})
}

function stream_notification(target){
	const options = {
		hostname: 'api.twitch.tv',
		port: 443,
		path: '/helix/streams?user_login='+target,
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			'Client-ID': process.env.CLIENT_ID,
			'Authorization': 'Bearer ' + access_token
		}
	}

	const data = JSON.stringify({user_login: target})

	const req = https.request(options, (res) => {
		if(res.statusCode !== 200){
			console.log("statusCode :"+res.statusCode);
		}
		res.on('data', d => {process.stdout.write(d)})
	})

	req.on('error', error => {console.error(error)})

	req.write("");
	req.end();
}

function sendCUrlRequest(type, target, channelID, iter = 0){
	let stream_url = "https://api.twitch.tv/helix/streams?user_login="+target;
	Child_process.exec("curl -H 'Client-ID: njy5v2njcv4492dsi7xtr80myninob' -X GET '"+stream_url+"'", function (error, stdout, stderr) {
		let response = JSON.parse(stdout);
		if(response.hasOwnProperty('error')){
	        console.log(stdout);
        }
	    else{
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
		}

	});
}

function sendCUrlRequestAlways(type, target, channelID){
	let url = null;
	let typeFound = false;
	let stream_url = "https://api.twitch.tv/helix/streams?user_login="+target;
	Child_process.exec("curl -H 'Client-ID: njy5v2njcv4492dsi7xtr80myninob' -X GET '"+stream_url+"'", function (error, stdout, stderr) {
		let response = JSON.parse(stdout);
		if(response.hasOwnProperty('error')){
			console.log(stdout);
		}
		else{
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
		}

	});
}

// Event Manager

client.on('ready', () => {
    console.log('I am ready!');
	//setInterval(function(){sendCUrlRequestAlways('getStreamInfo', 'geof2810', ChannelTestID);}, 10000);
	//setInterval(function(){sendCUrlRequestAlways('getStreamInfo', 'Dovvzie', ChannelLiveID);}, 10000);
	//setInterval(function(){sendCUrlRequestAlways('getStreamInfo', 'Chouchougeekart', ChannelLiveID);}, 10000);
	//setInterval(function(){sendCUrlRequestAlways('getStreamInfo', 'liguecosplay', ChannelLigueID);}, 10000);
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
		twitch_validation().then((message) => {
			if(message === "token_null"){
				twitch_authentication().then(() => {stream_notification("geof2810")})
			}
			else if(message === "token_outdated"){
				console.log("outdated ...")
			}
			else if(message === "token_valid"){
				stream_notification("geof2810");
			}
		})
		//twitch_authentication()
		//stream_notification("geof2810");
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

// THIS  MUST  BE  THIS  WAY

client.login(process.env.BOT_TOKEN);//BOT_TOKEN is the Client Secret
