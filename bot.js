// Global Variables 

const Discord = require('discord.js');
const https = require('https');
const client = new Discord.Client();

// Global Variables - State of Bot

// >> Twitch Variables
let access_token = null;
let refresh_token = null;
let expires_token = null;

// >> Discord Variables
let lastGiveAway = null;
let botMuted = false;
let botAdmin = [194524212134674432, 253491625328771073, 283740549448597505]
const ChannelLiveID = "453256711935885314";
const ChannelLigueID = "695943025855037440";
const ChannelTestID = "614263675947188231";

let ChannelOnLive = {"Chouchougeekart": 1, "Dovvzie": 1, "geof2810": 1,"liguecosplay": 1};

// Functions

function build_options(type, target, game_id){
	let options = {
		hostname: "id.twitch.tv", port: 443, method: "GET",
		headers:{'Content-Type': 'application/json'}
	}
	if(type === "validation"){
		options['path']= '/oauth2/validate'
		options["headers"]['Authorization'] = "OAuth " + access_token
	}
	else if(type === "authentication"){
		options['path'] = '/oauth2/token'
		options["method"] = "POST"
	}
	else if(type === "streams" || type === "games"){
		options["headers"]["Client-ID"] = process.env.CLIENT_ID
		options["headers"]["authorization"] = "Bearer "+access_token
		options["hostname"] = "api.twitch.tv"
		if(type === "streams"){options["path"] = "/helix/streams?user_login="+target}
		else{options["path"] =  '/helix/games?id='+game_id}
	}
	return options
}

function twitch_validation(){
	return new Promise((resolve, reject) => {
		if(access_token === null){
			resolve("token_null")
		}
		else {
			const options = build_options("validation")
			const req = https.get(options, (res) => {
				if (res.statusCode !== 200) {
					console.log("Token outdated : Code "+res.statusCode)
					resolve("token_outdated")
				}
				res.on('data', (d) => {resolve("token_valid")})
			})
			req.on('error', (e) => {console.error(e); reject()})
			req.end()
		}
	})
}

function twitch_authentication(){
	return new Promise((resolve, reject) => {
		const options = build_options("authentication", undefined, undefined)

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
				console.log("token_access granted")
				resolve("access_token_granted")
			})
		});

		req.on('error', error => {console.error(error);reject()})

		req.write(data);
		req.end();
	})
}

function stream_notification(target, channelID){
	const channel = client.channels.cache.get(channelID)
	const options = build_options("streams", target, undefined)
	const req = https.request(options, (res) => {
		if(res.statusCode !== 200){console.log("statusCode :"+res.statusCode);}
		res.on('data', (d) => {
			let response = JSON.parse(d)
			if(response.hasOwnProperty('error')){console.log(response)}
			else{
				if(response["data"].length === 0){ChannelOnLive[target] = 0;console.log(target+" not online ... 10 sec")}
				else{
					if(ChannelOnLive[target] === 0){
					    ChannelOnLive[target] = 1
						console.log(target+" just popped online !")
						let userStreaming = response["data"][0]
						let message = userStreaming["user_name"] + " est en live ! @everyone \nhttps://twitch.tv/"
							+ userStreaming["user_name"];
						let thumbnail = userStreaming["thumbnail_url"]
							.replace(/{width}/, "356")
							.replace(/{height}/, "200");
						let emb = new Discord.MessageEmbed()
							.setTitle(userStreaming["user_name"]+" est en LIVE !")
							.setDescription(userStreaming["title"])
							.setColor(0x02d414)
							.setImage(thumbnail)
							.setTimestamp(userStreaming["timestamp"])
							.setFooter("twitch.tv/"+userStreaming["user_name"]);

						if(userStreaming["game_id"]){
							const options2 = build_options("games", undefined, userStreaming["game_id"])

							const req2 = https.request(options2, (res2) => {
								if(res2.statusCode !== 200){console.log("StatusCode :"+res2.statusCode)}

								res2.on('data', (d2) => {
									let game_info = JSON.parse(d2)
									let game_played = game_info["data"][0]["box_art_url"]
										.replace(/{width}/, "60")
										.replace(/{height}/, "80")
									emb.setThumbnail(game_played)
										.addField('En live sur', game_info["data"][0]["name"], true)
									console.log("Twitch stream detected");
								})
							})
							req2.on('error', (error) => {console.log(error)})
							req2.end()
						}
						else{
							console.log("Twitch stream without category detected");
						}
						channel.send(message,{"embed": emb});
					}
				}
			}
		})
	})

	req.on('error', error => {console.error(error)})
	req.end();
}

// Event Manager

client.on('ready', () => {
    console.log('I am ready!');
    setInterval(function(){
        if(botMuted === false){
            twitch_validation().then((message) => {
                if(message === "token_null" || message === "token_outdated") {
                    twitch_authentication().then(() => {
                        stream_notification("geof2810", ChannelTestID);
                        stream_notification("Dovvzie", ChannelLiveID);
                        stream_notification("Chouchougeekart", ChannelLiveID);
                        stream_notification("liguecosplay", ChannelLigueID);
                    })
                }
                else if(message === "token_valid"){
                    stream_notification("geof2810", ChannelTestID);
                    stream_notification("Dovvzie", ChannelLiveID);
                    stream_notification("Chouchougeekart", ChannelLiveID);
                    stream_notification("liguecosplay", ChannelLigueID);
                }
            })
        }
	}, 10000)
});


client.on('message', (message) => {
 if(!(message.author.bot) && botMuted === false){

	let d = new Date();
	let currTimeStamp = d.getTime();
	 
    if (message.content === '!help'){
       message.reply('Voici les differentes commandes disponibles : \n !ping \n !tipeee \n !chouchou \n !dowzie \n et d\'autres plus secrètes :wink:');
    }
	 
    // Test Commands
	if (message.content === '!testStream') {
		twitch_validation().then((message) => {
			console.log(message)
			if(message === "token_null" || message === "token_outdated") {
				console.log("Token Authentication First")
				twitch_authentication().then(() => {
					stream_notification("geof2810", ChannelTestID);
				})
			}
			else if(message === "token_valid"){
				stream_notification("geof2810", ChannelTestID);
			}
		})
	}

	// Admin Commands
    if (message.content === '!mutebot' && message.author.id in botAdmin){
        botMuted = true
        message.reply('Ben si c\'est comme ca , moi je me casse !')
    }
    if (message.content === '!unmutebot' && message.author.id in botAdmin){
        botMuted = false
        message.reply('Allo ?? Allooo ? Ah je suis de retour !')
    }
 
    // >>> Fun Commands

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

     if (message.content === "!hipster"){
         message.channel.send("On m'a appelé ?");
         message.channel.send({files: ['./loreal.gif']});
     }

     if (message.content === "!hipsterdab"){
         message.channel.send({files: ['./hipsterdabv2.gif']});
     }


 
    // >>> Info Commands
 
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

 }
});

// THIS  MUST  BE  THIS  WAY

client.login(process.env.BOT_TOKEN);//BOT_TOKEN is the Client Secret
