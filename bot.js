// Global Variables & Imports

const Discord = require('discord.js');
const https = require('https');
const client = new Discord.Client();

// Global Variables - State of Bot

// >> Twitch Variables
let access_token = null;
let refresh_token = null;
let expires_token = null;

// >> Discord Variables
let last_give_away = null;

// >> >> Clips specific variables
let last_clip_time_start = new Date();
last_clip_time_start.setTime(last_clip_time_start.getTime() - 10*60*1000) // Detect during the last minute
let recent_clips_id = [];


let bot_muted = false;
const bot_admin = ["194524212134674432", "253491625328771073", "283740549448597505"]
const channel_live_id = "453256711935885314";
const channel_ligue_id = "695943025855037440";
const channel_clips_id = "693665642875977808";
const channel_test_id = "614263675947188231";
const channel_geof_test_id = "618874167810326561";

let channel_on_live = {"chouchougeekart": 1, "dovvzie": 1, "geof2810": 1, "liguecosplay": 1};

// Priority of the screen goes from the last to the first keys of this dictionary.
let streamers_assets = {"celkae": ["celkae_1.png", "celkae_2.png", "celkae_3.png", "celkae_4.png"],
    "chouchou": ["chouchou_1.png", "chouchou_2.png", "chouchou_3.png", "chouchou_4.png"],
    "dowzie": ["dowzie_1.png", "dowzie_2.png", "dowzie_3.png", "dowzie_4.png"],
    "geof2810": ["geof2810_1.png"],
    "mathoz": ["mathoz_1.png", "mathoz_2.png", "mathoz_3.png", "mathoz_4.png"],
    "osanguine": ["osanguine_1.png", "osanguine_2.png", "osanguine_3.png", "osanguine_4.png"],
    "shinosan": ["shinosan_1.png", "shinosan_2.png", "shinosan_3.png", "shinosan_4.png"],
    "tsukiyo": ["tsukiyo_1.png", "tsukiyo_2.png", "tsukiyo_3.png", "tsukiyo_4.png"],
	"kyuti": ["kyuti_1.png", "kyuti_2.png", "kyuti_3.png", "kyuti_4.png"],
    "deedee": ["deedee_1.png", "deedee_2.png", "deedee_3.png", "deedee_4.png"],
    "ecc": ["ecc_1.png"],
    "extraordinaire cosplay challenge": ["ecc_1.png"],
    "radio cosplay": ["radio_cosplay_announce.png"],
    "secret de cosplay": ["secret_de_cosplay_announce.png"],
    "secrets de cosplay": ["secret_de_cosplay_announce.png"],
    "cosplay for pet": ["Cosplay_for_Pet.png"]
}

// >> Functions

// >> >> Twitch specifics

function build_options(type, target, game_id, pagination = null) {
    let options = {
        hostname: "id.twitch.tv", port: 443, method: "GET",
        headers: {'Content-Type': 'application/json', 'Cache-Control': 'no-store'}
    }
    if (type === "validation") {
        options['path'] = '/oauth2/validate'
        options["headers"]['Authorization'] = "OAuth " + access_token
    } else if (type === "authentication") {
        options['path'] = '/oauth2/token'
        options["method"] = "POST"
    } else if (type === "streams" || type === "games" || type === "clips" || type === "users") {
        options["headers"]["Client-ID"] = process.env.CLIENT_ID
        options["headers"]["authorization"] = "Bearer " + access_token
        options["hostname"] = "api.twitch.tv"
        if (type === "streams") {
            options["path"] = "/helix/streams?user_login=" + target
        } else if (type === "users") {
            options["path"] = "/helix/users?login=" + target
        } else if (type === "clips") {
            //options["path"] = "/helix/clips?broadcaster_id=" + target + "&first=100"//&started_at="+lastClipTime.toISOString()
            options["path"] = "/helix/clips?broadcaster_id=" + target + "&started_at="+last_clip_time_start.toISOString();
            if (pagination !== null) {
                options["path"] += "&after=" + pagination
            }
        } else {
            options["path"] = '/helix/games?id=' + game_id
        }
    }
    return options
}

function twitch_validation() {
    return new Promise((resolve, reject) => {
        if (access_token === null) {
            resolve("token_null")
        } else {
            const options = build_options("validation")
            const req = https.get(options, (res) => {
                if (res.statusCode !== 200) {
                    console.log("Token outdated : Code " + res.statusCode);
                    resolve("token_outdated")
                }
                res.on('data', (d) => {
                    resolve("token_valid")
                })
            })
            req.on('error', (e) => {
                console.error(e);
                reject()
            })
            req.end()
        }
    })
}

function twitch_authentication() {
    return new Promise((resolve, reject) => {
        const options = build_options("authentication", undefined, undefined)

        const data = JSON.stringify({
            client_id: process.env.CLIENT_ID, client_secret: process.env.CLIENT_SECRET,
            grant_type: "client_credentials"
        });

        const req = https.request(options, (res) => {
            if (res.statusCode !== 200) {
                console.log('statusCode :' + res.statusCode);
                console.log(res.statusMessage);
                reject();
            }

            res.on('data', d => {
                let data_result = JSON.parse(d);
                access_token = data_result["access_token"];
                refresh_token = data_result["refresh_token"];
                expires_token = data_result["expires_in"];
                console.log("token_access granted");
                resolve("access_token_granted");
            })
        });

        req.on('error', error => {
            console.error(error);
            reject()
        })

        req.write(data);
        req.end();
    })
}

// >> >> Streams notification

function get_announce_title(target) {
    let target_nice = target
    if (target === "liguecosplay") {
        target_nice = "La Ligue Des Cosplayeurs Extraordinaires";
    }
    return "**" + target_nice + " est en live !** @everyone \nhttps://twitch.tv/" + target;
}

function get_announce_embed(target, title, image_url, timestamp) {
    let result = new Discord.MessageEmbed().setTitle(title).setColor(0x02d414).setTimestamp(timestamp)
        .setFooter("twitch.tv/" + target).setURL("https://twitch.tv/" + target);
    let image = null;
    try{
        image = image_url.replace(/{width}/, "356").replace(/{height}/, "200");
        if (target === 'liguecosplay') {
            image = "generic.png";
            let regexValue = new RegExp(/ /g)
            let streamersKeys = Object.keys(streamers_assets)
            for (let i = 0; i < streamersKeys.length; i++) {
                if (title.toLowerCase().includes(streamersKeys[i].toLowerCase(), 0)) {
                    let listAsset = streamers_assets[streamersKeys[i]]
                    let screen_id = Math.floor(Math.random() * listAsset.length)
                    image = listAsset[screen_id];
                }
            }
        }
        if (target === 'geof2810') {
            image = streamers_assets["geof2810"][0]
        }
        if (target === 'chouchougeekart'){
            let screen_id = Math.floor(Math.random() * streamers_assets["chouchou"].length)
            image = streamers_assets["chouchou"][screen_id];
        }
        if (target === 'dovvzie'){
            let screen_id = Math.floor(Math.random() * streamers_assets["dowzie"].length)
            image = streamers_assets["dowzie"][screen_id];
        }
        result.attachFiles(["streaming_announce/"+image]).setImage("attachment://"+image)
    }
    catch(e){
        console.log(e)
        image = image_url.replace(/{width}/, "356").replace(/{height}/, "200");
        result.setImage(image)
    }
    return result
}

function stream_notification(target, channelID) {
    const channel = client.channels.cache.get(channelID)
    const options = build_options("streams", target, undefined)
    const req = https.request(options, (res) => {
        res.on('data', (d) => {
            let response = JSON.parse(d)
            if (response.hasOwnProperty('error')) {
                console.log(response)
            } else {
                if (response["data"].length === 0) {
                    channel_on_live[target] = 0;
                    console.log(target + " not online ... 10 sec");
                } else {
                    if (channel_on_live[target] === 0) {
                        channel_on_live[target] = 1
                        let userStreaming = response["data"][0]
                        let message = get_announce_title(userStreaming["user_name"].toLowerCase());
                        let emb = get_announce_embed(userStreaming["user_name"].toLowerCase(), userStreaming["title"],
                            userStreaming["thumbnail_url"], userStreaming["timestamp"]);

                        if (userStreaming["game_id"]) {
                            const options2 = build_options("games", undefined, userStreaming["game_id"])
                            const req2 = https.request(options2, (res2) => {
                                res2.on('data', (d2) => {
                                    let game_info = JSON.parse(d2)
                                    let game_played = game_info["data"][0]["box_art_url"]
                                        .replace(/{width}/, "60").replace(/{height}/, "80")
                                    emb.setThumbnail(game_played)
                                        .addField('En live sur', game_info["data"][0]["name"], true)
                                    channel.send(message, {"embed": emb});
                                })
                            })
                            req2.on('error', (error) => {
                                console.log(error)
                            })
                            req2.end()
                        } else {
                            channel.send(message, {"embed": emb});
                        }

                    }
                }
            }
        })
    })

    req.on('error', error => {
        console.error(error)
    })
    req.end();
}

// >> >> Clips Notifications

function clips_notification(target, channelID, firstCall = false) {
    const channel = client.channels.cache.get(channelID);
    const options = build_options("users", target, undefined);

    const reqID = https.request(options, (res) => {
        let result_buffer = ""
        res.on("data", (d) => {
            result_buffer += d;
        })
        res.on("end", async () => {
            let result = JSON.parse(result_buffer);
            let result_id = result["data"][0]["id"];

            let pagination = null;
            let clips_results = null;


            while (pagination === null || Object.keys(pagination).length !== 0) {
                if (pagination === null) {
                    await get_clips_list(result_id).then((message) => {
                        clips_results = message;
                    })
                } else {
                    await get_clips_list(result_id, pagination["cursor"]).then((message) => {
                        clips_results = message
                    })
                }

                for (let i = 0; i < clips_results["data"].length; i++) {
                    let id = clips_results["data"][i]["id"];
                    let url = clips_results["data"][i]["url"];

                    if(firstCall == true){
                        recent_clips_id.push(id);
                    }
                    else{
                        if(!recent_clips_id.includes(id)){
                            recent_clips_id.push(id);
                            channel.send("Nouveau clip chez "+target+": "+url);
                        }
                    }

                }

                pagination = clips_results["pagination"]
            }
        })
    })

    reqID.on('error', error => {
        console.error(error)
    })
    reqID.end();
}

function get_clips_list(twitch_id, pagination = null) {

    return new Promise((resolve, reject) => {
        let clips_buffer = ""
        const options2 = build_options("clips", twitch_id, undefined, pagination);
        //console.log(options2)
        const req = https.request(options2, (res2) => {
            res2.on("data", (d) => {
                clips_buffer += d;
            });
            res2.on("end", () => {
                //console.log(clips_buffer)
                resolve(JSON.parse(clips_buffer))
            })
        })
        req.on('error', error => {
            console.error(error);
            reject()
        })
        req.end()
    })
}

// Event Manager

client.on('ready', () => {
    console.log('I am ready!');
    setInterval(function () {
        if (bot_muted === false) {
            twitch_validation().then((message) => {
                if (message === "token_null" || message === "token_outdated") {
                    twitch_authentication().then(() => {

                        stream_notification("geof2810", channel_geof_test_id);
                        stream_notification("dovvzie", channel_live_id);
                        stream_notification("chouchougeekart", channel_live_id);
                        stream_notification("liguecosplay", channel_ligue_id);

                        clips_notification("geof2810", channel_geof_test_id, true);
                        clips_notification("dovvzie", channel_clips_id, true);
                        clips_notification("chouchougeekart", channel_clips_id, true);
                        clips_notification("liguecosplay", channel_clips_id, true);
                    })
                } else if (message === "token_valid") {

                    stream_notification("geof2810", channel_geof_test_id);
                    stream_notification("dovvzie", channel_live_id);
                    stream_notification("chouchougeekart", channel_live_id);
                    stream_notification("liguecosplay", channel_ligue_id);

                    clips_notification("geof2810", channel_geof_test_id);
                    clips_notification("dovvzie", channel_clips_id);
                    clips_notification("chouchougeekart", channel_clips_id);
                    clips_notification("liguecosplay", channel_clips_id);
                }
            })
        }

        last_clip_time_start.setTime(last_clip_time_start.getTime()+15*1000);

    }, 15000)
});


client.on('message', async(message) => {
    if (!(message.author.bot) && bot_muted === true) {
        if (message.content === '!unmutebot' && bot_admin.includes(message.author.id.toString())) {
            bot_muted = false
            message.reply('Allo ?? Allooo ? Ah je suis de retour !')
        }
    }

    if (!(message.author.bot) && bot_muted === false) {

        let d = new Date();
        let currTimeStamp = d.getTime();

        if (message.content === '!help') {
            message.reply('Voici les differentes commandes disponibles : \n !ping \n !tipeee \n !chouchou \n !dowzie \n et d\'autres plus secrètes :wink:');
        }

        // Test Commands
        /*if (message.content.includes('!testStream') && bot_admin.includes(message.author.id.toString())) {
            let emb = null;
            if (message.content.includes('liguecosplay')){
                emb = get_announce_embed("liguecosplay", message.content, "", 0)
            }
            else{
                if (message.content.includes('chouchougeekart')){
                    emb = get_announce_embed("chouchougeekart", "test chouchougeekart", "", 0)
                }
                if (message.content.includes('dovvzie')){
                    emb = get_announce_embed("dovvzie", "test dovvzie", "", 0)
                }
            }
            message.reply({"embed": emb})
        }*/

        // Admin Commands

        if (message.content === '!mutebot' && bot_admin.includes(message.author.id.toString())) {
            bot_muted = true
            message.reply('Ben si c\'est comme ca , moi je me casse !')
        }

        // >>> Fun Commands

        if (message.content.toLowerCase().includes('faute de jezal', 0)) {
            message.reply('Tut tut tut ! Comme inscrit dans la constitution, c\'est la faute A Jezal !');
        }
        if (message.content.toLowerCase().includes('prout', 0)) {
            message.reply('C\'est toi le prout !');
        }
        if (message.content.toLowerCase().includes('pizza', 0) && message.content.toLowerCase().includes('ananas')) {
            message.channel.send('J\'ai entendu Pizza et Ananas dans la même phrase, j\'espere que vous ne mangez pas ca ! \n https://tenor.com/view/ew-disgust-gif-3671501');
        }
        if (message.content.toLowerCase().includes('nutella', 0)) {
            message.reply({files: ['./nutella.gif']});
        }
        if (message.content.toLowerCase().includes('giveaway', 0) && currTimeStamp - last_give_away > 14400000) {
            message.channel.send('Comment ?! J\'ai entendu giveaway ? je préviens tout de suite <@253491625328771073> !');
            last_give_away = d.getTime();
        }

        if (message.content === "!hipster") {
            message.channel.send("On m'a appelé ?");
            message.channel.send({files: ['./loreal.gif']});
        }

        if (message.content === "!hipsterdab") {
            message.channel.send({files: ['./hipsterdabv2.gif']});
        }


        // >>> Info Commands

        if (message.content === '!chouchou') {
            message.reply('Go follow pour ne rien rater ! \n:dagger:  Facebook : <https://www.facebook.com/Chouchougeekart> \n \
:dagger:  Twitter : <https://twitter.com/ChouchouGeekArt> \n:dagger:  Instagram : <https://www.instagram.com/chouchougeekart> \n:dagger:  Twitch : <https://www.twitch.tv/chouchougeekart> \n:dagger:  Site internet : <https://chouchougeekart.blogspot.com> \n:dagger:  Youtube : <https://www.youtube.com/channel/UC4YWjAguofYoh29b6rBTwCw/featured>');
        }
        if (message.content === '!dowzie') {
            message.reply('Go follow pour ne rien rater ! \n:pushpin:  Facebook : <https://www.facebook.com/DowzieCosplay> \n \
:pushpin:  Twitter : <https://twitter.com/dovvzie> \n:pushpin:  Instagram : <https://www.instagram.com/dovvzie> \n:pushpin:  Twitch : <https://www.twitch.tv/dovvzie>');
        }

    }
});

// THIS  MUST  BE  THIS  WAY

client.login(process.env.BOT_TOKEN);//BOT_TOKEN is the Client Secret
