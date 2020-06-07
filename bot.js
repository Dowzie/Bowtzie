// Global Variables & Imports

const Discord = require('discord.js');
const https = require('https');
const cryptoMD5 = require('crypto-js/md5')
const client = new Discord.Client();

// Global Variables - State of Bot

// >> Twitch Variables
let access_token = null;
let refresh_token = null;
let expires_token = null;

// >> Discord Variables
let lastGiveAway = null;
let lastClipTime = new Date();
let botMuted = false;
const botAdmin = ["194524212134674432", "253491625328771073", "283740549448597505"]
const ChannelLiveID = "453256711935885314";
const ChannelLigueID = "695943025855037440";
const ChannelTestID = "614263675947188231";
const ChannelGeofTestID = "618874167810326561";

let ChannelOnLive = {"chouchougeekart": 0, "dovvzie": 1, "geof2810": 1, "liguecosplay": 1};
let streamersOnLigue = ["dowzie", "osanguine", "shinosan", "chouchou", "tsukiyo", "celkae", "mathoz", "radio cosplay", "secret de cosplay","secrets de cosplay", "ecc"]

// >> Functions

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
            options["path"] = "/helix/clips?broadcaster_id=" + target + "&first=100"//&started_at="+lastClipTime.toISOString()
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

function get_announce_title(target) {
    let target_nice = target
    if (target === "liguecosplay") {
        target_nice = "La Ligue Des Cosplayeurs Extraordinaires";
    }
    return "**" + target_nice + " est en live !** @everyone \nhttps://twitch.tv/" + target;
}

function get_announce_embed(target, title, image_url, timestamp) {
    let prefix_url = "https://raw.githubusercontent.com/Dowzie/Bowtzie/master/streaming_announce/";
    let image = image_url.replace(/{width}/, "356").replace(/{height}/, "200");
    if (target === 'liguecosplay') {
        image = prefix_url + "generic_announce.png";
        let regexValue = new RegExp(/ /g)
        for (let i = 0; i < streamersOnLigue.length; i++) {
            if (title.toLowerCase().includes(streamersOnLigue[i].toLowerCase(), 0)) {
                image = prefix_url + streamersOnLigue[i].toLowerCase().replace(regexValue, "_") + "_announce.png";
            }
        }
    }
    if (target === 'geof2810') {
        image = prefix_url + "geof2810_announce.png";
    }
    if (target === 'chouchougeekart'){
        image = prefix_url + "chouchougeekart_announce.png";
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
                    ChannelOnLive[target] = 0;
                    console.log(target + " not online ... 10 sec");
                } else {
                    if (ChannelOnLive[target] === 0) {
                        ChannelOnLive[target] = 1
                        let userStreaming = response["data"][0]
                        let message = get_announce_title(userStreaming["user_name"]);
                        let emb = get_announce_embed(userStreaming["user_name"], userStreaming["title"],
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

function clips_notification(target, channelID) {
    const channel = client.channels.cache.get(channelID);
    const options = build_options("users", target, undefined);

    const reqID = https.request(options, (res) => {
        let result_buffer = ""
        res.on("data", (d) => {
            result_buffer += d;
        })
        res.on("end", async () => {
            let result = JSON.parse(result_buffer)
            let result_id = result["data"][0]["id"];

            let pagination = null;
            let clips_results = null;
            while (pagination === null || Object.keys(pagination).length !== 0) {
                if (pagination === null) {
                    await get_clips_list(result_id).then((message) => {
                        clips_results = message
                    })
                } else {
                    await get_clips_list(result_id, pagination["cursor"]).then((message) => {
                        clips_results = message
                    })
                }

                for (let i = 0; i < clips_results["data"].length; i++) {
                    let url = clips_results["data"][i]["url"]
                    let creation_date = clips_results["data"][i]["created_at"]

                    let creation_date_object = new Date(creation_date)
                    console.log(creation_date_object)
                    console.log(lastClipTime)
                    console.log(url)
                    if (lastClipTime.getUTCMilliseconds() < creation_date_object.getUTCMilliseconds()) {
                        channel.send(url)
                        lastClipTime = creation_date_object
                    }
                }

                pagination = clips_results["pagination"]
                console.log(pagination)
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
        console.log(options2)
        const req = https.request(options2, (res2) => {
            res2.on("data", (d) => {
                clips_buffer += d;
            });
            res2.on("end", () => {
                console.log(clips_buffer)
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

async function analyse_hash_file(fileURL){
    return new Promise((resolve, reject) => {
        let res = false;
        https.get(fileURL, (res) => {
            let hash_values = res.headers["x-goog-hash"].split(", ")
            console.log(hash_values)
            if(hash_values[1] === "md5=uTgzkqUBhAup6L+FKmKv0Q=="){
                console.log("value true")
                resolve(true)
            }
            else{
                resolve(false)
            }
        }).on("error", () => {reject()})
    })
}

// Event Manager

client.on('ready', () => {
    console.log('I am ready!');
    setInterval(function () {
        if (botMuted === false) {
            twitch_validation().then((message) => {
                if (message === "token_null" || message === "token_outdated") {
                    twitch_authentication().then(() => {
                        stream_notification("geof2810", ChannelGeofTestID);
                        stream_notification("dovvzie", ChannelLiveID);
                        stream_notification("chouchougeekart", ChannelLiveID);
                        stream_notification("liguecosplay", ChannelLigueID);
                    })
                } else if (message === "token_valid") {
                    stream_notification("geof2810", ChannelGeofTestID);
                    stream_notification("dovvzie", ChannelLiveID);
                    stream_notification("chouchougeekart", ChannelLiveID);
                    stream_notification("liguecosplay", ChannelLigueID);
                }
            })
        }
    }, 15000)
});


client.on('message', async(message) => {
    if (!(message.author.bot) && botMuted === true) {
        if (message.content === '!unmutebot' && botAdmin.includes(message.author.id.toString())) {
            botMuted = false
            message.reply('Allo ?? Allooo ? Ah je suis de retour !')
        }
    }

    if (!(message.author.bot) && botMuted === false) {

        let d = new Date();
        let currTimeStamp = d.getTime();


        if (message.author.id.toString() === "406137148216180747" || message.author.id.toString() === "253491625328771073"){
            // Detect if B__ora sent an image
            let screen_content = message.attachments.entries()
            let iterator_value = screen_content.next().value;
            let screen_ananas = false;
            while(iterator_value !== undefined){
                let fileURL = iterator_value[1]["url"]
                analyse_hash_file(fileURL).then((res) => {
                    if(res == true) {
                        if(screen_ananas !== true){
                            message.reply("Ce message est une falsification. Voici la vrai image ! Certifiée par <@253491625328771073> !", {files: ['./b__ora_fake.png']})
                        }
                        screen_ananas = true
                    }
                })
                iterator_value = screen_content.next().value;
            }
        }




        if (message.content === '!help') {
            message.reply('Voici les differentes commandes disponibles : \n !ping \n !tipeee \n !chouchou \n !dowzie \n et d\'autres plus secrètes :wink:');
        }

        // Test Commands
        if (message.content === '!testStream' && botAdmin.includes(message.author.id.toString())) {
            let emb = get_announce_embed("liguecosplay", "SECRET DE COSPLAY - Tous les détails du costume de FREYA w/ Chouchou et Dowzie", "", 0)
            message.reply({"embed": emb})
        }


        // Admin Commands
        if (message.content === '!mutebot' && botAdmin.includes(message.author.id.toString())) {
            botMuted = true
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
        if (message.content.toLowerCase().includes('giveaway', 0) && currTimeStamp - lastGiveAway > 14400000) {
            message.channel.send('Comment ?! J\'ai entendu giveaway ? je préviens tout de suite <@253491625328771073> !');
            lastGiveAway = d.getTime();
        }

        if (message.content === "!hipster") {
            message.channel.send("On m'a appelé ?");
            message.channel.send({files: ['./loreal.gif']});
        }

        if (message.content === "!hipsterdab") {
            message.channel.send({files: ['./hipsterdabv2.gif']});
        }


        // >>> Info Commands

        if (message.content === '!tipeee') {
            message.reply('Go me support sur Tipeee si tu aime mon job, plein de trucs cool en contrepartie :wink: \nhttps://fr.tipeee.com/dowzie');
        }
        if (message.content === '!chouchou') {
            message.reply('Go follow pour ne rien rater ! \n:dagger:  Facebook : <https://www.facebook.com/Chouchougeekart> \n \
:dagger:  Twitter : <https://twitter.com/ChouchouGeekArt> \n:dagger:  Instagram : <https://www.instagram.com/chouchougeekart> \n:dagger:  Twitch : <https://www.twitch.tv/chouchougeekart> \n:dagger:  Site internet : <https://chouchougeekart.blogspot.com> \n:dagger:  Youtube : <https://www.youtube.com/channel/UC4YWjAguofYoh29b6rBTwCw/featured>');
        }
        if (message.content === '!dowzie') {
            message.reply('Go follow pour ne rien rater ! \n:pushpin:  Facebook : <https://www.facebook.com/DowzieCosplay> \n \
:pushpin:  Twitter : <https://twitter.com/dovvzie> \n:pushpin:  Instagram : <https://www.instagram.com/dovvzie> \n:pushpin:  Twitch : <https://www.twitch.tv/dovvzie> \n:pushpin:  Tipeee : <https://fr.tipeee.com/dowzie>');
        }

    }
});

// THIS  MUST  BE  THIS  WAY

client.login(process.env.BOT_TOKEN);//BOT_TOKEN is the Client Secret
