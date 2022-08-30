// const discord = require('discord.js');
const sqlite3 = require('sqlite3');
const backup = require("discord-backup");
const schedule = require('node-schedule');
const Database = require('better-sqlite3');
const db = new Database('data.db');
const express = require('express');
const { Routes } = require('discord-api-types/v9');
const { REST } = require('@discordjs/rest');
const fetch = require("node-fetch");
const fs = require('fs')
const { randomUUID } = require('crypto');
const app = express()
const { TOKEN, staff, embed_name, backup_log_channel, license_log_channel, ba_log_channel, bac_log_channel, prefix } = require('./config.json')
const bottkn = new REST().setToken(TOKEN);
const { MessageEmbed, Client , Intents , Collection } = require('discord.js');
const client = new Client({intents:32767})
backup.setStorageFolder(__dirname+"/backups/");
function sleep(ms) {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
}

client.commands = new Collection()

const commandsFile = fs.readdirSync('./commands').filter(file => file.endsWith('.js'))

for(const file of commandsFile){
    const command = require(`./commands/${file}`)
    client.commands.set(command.name , command)
}

client.on('messageCreate' , message=>{
    if(!message.content.startsWith(prefix)) return
    const args = message.content.slice(prefix.length).trim().split(/ +/)
    const commandName = args.shift()
    const command = client.commands.get(commandName)
    if (!command) return
    try{
        command.execute(message,args)
    } catch (error) {
        console.error(error)
    }
})

client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`)
    while (true) {
        let number = 0
        setInterval(() => {
            const list = [`${client.guilds.cache.size}개의 서버 관리`, "SinServerBackup"]
            if(number == list.length) number = 0
            client.user.setActivity(list[number],{
                type:"PLAYING"
            })
            number++
        }, 2000)  
        console.log("[+] 서버 백업 시작됨")
        const embed16 = new MessageEmbed()
        .setTitle(`${embed_name}`)
        .setColor('DBE6F6')
        .setDescription('서버 백업이 시작되었습니다.');
        client.channels.cache.get(`${backup_log_channel}`).send({ embeds: [embed16] });
        let rows = db.prepare(`SELECT * FROM guild`).all();
        for (let index = 0; index < rows.length; index++){
            let row = rows[index];
            let guild = client.guilds.cache.get(row.guild_id);
            if (guild != undefined) {
                try {
                    console.log(`[+] ${guild.name} | 백업 시작`)
                    let backup_data = await backup.create(guild, {
                        jsonBeautify: true,
                        jsonSave: true,
                    })
                    console.log(`[+] ${guild.name} | 백업 종료`)
                    db.prepare(`UPDATE guild SET filename=? WHERE guild_id=?;`).run(backup_data.id, row.guild_id);
                } catch (error) {
                }
            }
        }
        const embed17 = new MessageEmbed()
        .setTitle(`${embed_name}`)
        .setColor('DBE6F6')
        .setDescription('서버 백업이 종료되었습니다.');
        client.channels.cache.get(`${backup_log_channel}`).send({ embeds: [embed17] });
        console.log("[+] 서버 백업 종료됨");
        await sleep(18000000);
    }
});


client.on("guildCreate", (guild) => {
    console.log(`[+] 새로운 서버에 추가됨. 서버 이름 : ${guild.name}`);
    client.user.setActivity(`${client.guilds.cache.size}개의 서버 관리`, { type: 'PLAYING' })
});

function dateAdd(date, interval, units) {
    if(!(date instanceof Date))
      return undefined;
    var ret = new Date(date);
    var checkRollover = function() { if(ret.getDate() != date.getDate()) ret.setDate(0);};
    switch(String(interval).toLowerCase()) {
      case 'year'   :  ret.setFullYear(ret.getFullYear() + units); checkRollover();  break;
      case 'quarter':  ret.setMonth(ret.getMonth() + 3*units); checkRollover();  break;
      case 'month'  :  ret.setMonth(ret.getMonth() + units); checkRollover();  break;
      case 'week'   :  ret.setDate(ret.getDate() + 7*units);  break;
      case 'day'    :  ret.setDate(ret.getDate() + units);  break;
      case 'hour'   :  ret.setTime(ret.getTime() + units*3600000);  break;
      case 'minute' :  ret.setTime(ret.getTime() + units*60000);  break;
      case 'second' :  ret.setTime(ret.getTime() + units*1000);  break;
      default       :  ret = undefined;  break;
    }
    return ret;
  }

function formatDate(date){
    return ('{0}-{1}-{3} {4}:{5}:{6}').replace('{0}', date.getFullYear()).replace('{1}', date.getMonth() + 1).replace('{3}', date.getDate()).replace('{4}', date.getHours()).replace('{5}', date.getMinutes()).replace('{6}', date.getSeconds())
}
client.on('message', async (message) => {
    if (message.author.bot) return;
    if (message.content.startsWith(`${prefix}help`)||message.content.startsWith(`${prefix}도움말`)||message.content.startsWith(`${prefix}명령어`)) {
        const embed = new MessageEmbed()
        .setTitle(`${embed_name}`)
        .setColor('DBE6F6')
        .setDescription('명령어들')
        .addField(`라이센스`, `${prefix}30일생성, 무제한생성`, true)
        .addField(`등록`, `${prefix}30일등록, 기간등록 | 무제한등록, 등록`, true)
        .addField(`초대`, `${prefix}초대 or invite`)
        .addField(`복구 및 백업`, `${prefix}복구  | 백업 and 올백업`);
        return message.channel.send({ embeds: [embed] });
    }
    if (message.content.startsWith(`${prefix}30일등록`)||message.content.startsWith(`${prefix}기간등록`)) {
        if(message.author.id != message.guild.ownerId){
            const embed = new MessageEmbed()
            .setTitle(`${embed_name}`)
            .setColor('DBE6F6')
            .setDescription('당신은 서버 소유권 보유자가 아닙니다.');
            return message.channel.send({ embeds: [embed] });
        }
        try {
            await message.delete()
        } catch (error) {  
        }
        let args = message.content.trim().split(/ +/g);
        if (args.length != 2) {
            const embed2 = new MessageEmbed()
            .setTitle(`${embed_name}`)
            .setColor('DBE6F6')
            .setDescription(`\`\`${prefix}기간등록 [라이센스]\`\` 형식으로 명령어를 이용해주세요.`);
            return message.channel.send({ embeds: [embed2] });
        }
        let row = db.prepare("SELECT * FROM license WHERE license=?").all(args[1]);
        if (row.length == 0) {
            const embed3 = new MessageEmbed()
            .setTitle(`${embed_name}`)
            .setColor('DBE6F6')
            .setDescription('해당 라이센스는 존재하지 않습니다.');
            return message.channel.send({ embeds: [embed3] });
        } 
        db.prepare("DELETE FROM license WHERE license=?").run(args[1])
        let guild = message.guild;
        let user = message.author;
        let guild_id = guild.id;
        let backup_code = randomUUID();
        let exp = dateAdd(new Date(), "month", 1);
        row = db.prepare(`SELECT * FROM guild WHERE guild_id=?`).get(guild_id);
        if (row == undefined) {
            db.prepare(`INSERT INTO guild VALUES (?, ?, ?, ?);`).run(guild_id, backup_code, "", formatDate(exp));
        } else {
            backup_code = row.backup_code
            let cur_exp = new Date(Date.parse(row.timestamp))
            if (cur_exp > Date.now()){
                exp = dateAdd(cur_exp, "month", 1)
            }
            db.prepare(`UPDATE guild SET timestamp=? WHERE guild_id=?;`).run(formatDate(exp), guild_id);
        }
        const embed4 = new MessageEmbed()
        .setTitle(`${embed_name}`)
        .setColor('DBE6F6')
        .setDescription(`복구키 : **${backup_code}**\n**복구키**는 복구를 할때 쓰이니 꼭 기억해주세요.`);
        message.author.send({ embeds: [embed4] });
        const embed18 = new MessageEmbed()
        .setTitle(`${embed_name}`)
        .setColor('DBE6F6')
        .setDescription(`등록자 : <@${message.author.id}>(${message.author.username}#${message.author.discriminator})\n복구키 : ||${backup_code}||\n서버 : ${message.guild.name}(${message.guild.id})\n라이센스 : ${args}(30일)`);
        client.channels.cache.get(`${ba_log_channel}`).send({ embeds: [embed18] });
        const embed5 = new MessageEmbed()
        .setTitle(`${embed_name}`)
        .setColor('DBE6F6')
        .setDescription('DM을 확인해주세요.');
        message.channel.send({ embeds: [embed5] });
    }
    if (message.content.startsWith(`${prefix}무제한등록`)||message.content.startsWith(`${prefix}등록`)) {
        if(message.author.id != message.guild.ownerId){
            const embed = new MessageEmbed()
            .setTitle(`${embed_name}`)
            .setColor('DBE6F6')
            .setDescription('당신은 서버 소유권 보유자가 아닙니다.');
            return message.channel.send({ embeds: [embed] });
        }
        try {
            await message.delete()
        } catch (error) {  
        }
        let args = message.content.trim().split(/ +/g);
        if (args.length != 2) {
            const embed2 = new MessageEmbed()
            .setTitle(`${embed_name}`)
            .setColor('DBE6F6')
            .setDescription(`\`\`${prefix}등록 [라이센스]\`\` 형식으로 명령어를 이용해주세요.`);
            return message.channel.send({ embeds: [embed2] });
        }
        let row = db.prepare("SELECT * FROM license2 WHERE license2=?").all(args[1]);
        if (row.length == 0) {
            const embed3 = new MessageEmbed()
            .setTitle(`${embed_name}`)
            .setColor('DBE6F6')
            .setDescription('해당 라이센스는 존재하지 않습니다.');
            return message.channel.send({ embeds: [embed3] });
        } 
        db.prepare("DELETE FROM license2 WHERE license2=?").run(args[1])
        let guild = message.guild;
        let user = message.author;
        let guild_id = guild.id;
        let backup_code = randomUUID();
        let exp = dateAdd(new Date(), "year", 10);
        row = db.prepare(`SELECT * FROM guild WHERE guild_id=?`).get(guild_id);
        if (row == undefined) {
            db.prepare(`INSERT INTO guild VALUES (?, ?, ?, ?);`).run(guild_id, backup_code, "", formatDate(exp));
        } else {
            backup_code = row.backup_code
            let cur_exp = new Date(Date.parse(row.timestamp))
            if (cur_exp > Date.now()){
                exp = dateAdd(cur_exp, "year", 10)
            }
            db.prepare(`UPDATE guild SET timestamp=? WHERE guild_id=?;`).run(formatDate(exp), guild_id);
        }
        const embed4 = new MessageEmbed()
        .setTitle(`${embed_name}`)
        .setColor('DBE6F6')
        .setDescription(`복구키 : **${backup_code}**\n**복구키**는 복구를 할때 쓰이니 꼭 기억해주세요.`);
        message.author.send({ embeds: [embed4] });
        const embed19 = new MessageEmbed()
        .setTitle(`${embed_name}`)
        .setColor('DBE6F6')
        .setDescription(`등록자 : <@${message.author.id}>(${message.author.username}#${message.author.discriminator})\n복구키 : ||${backup_code}||\n서버 : ${message.guild.name}(${message.guild.id})\n라이센스 : ${args}(10년)`);
        client.channels.cache.get(`${ba_log_channel}`).send({ embeds: [embed19] });
        const embed5 = new MessageEmbed()
        .setTitle(`${embed_name}`)
        .setColor('DBE6F6')
        .setDescription('DM을 확인해주세요.');
        message.channel.send({ embeds: [embed5] });
    }
    if (message.content.startsWith(`${prefix}30일생성`)){
        if (!staff.includes(message.author.id)) return
        let license = randomUUID();
        const embed6 = new MessageEmbed()
        .setTitle(`${embed_name}`)
        .setColor('DBE6F6')
        .setDescription('DM을 확인해주세요.');
        message.channel.send({ embeds: [embed6] });
        const embed7 = new MessageEmbed()
        .setTitle(`${embed_name}`)
        .setColor('DBE6F6')
        .setDescription(`**${license}**`);
        message.author.send({ embeds: [embed7] });
        const embed20 = new MessageEmbed()
        .setTitle(`${embed_name}`)
        .setColor('DBE6F6')
        .setDescription(`생성자 : <@${message.author.id}>(${message.author.tag})\n라이센스 : ||${license}||(30일)`);
        client.channels.cache.get(`${license_log_channel}`).send({ embeds: [embed20] });
        db.prepare(`INSERT INTO license VALUES (?);`).run(license);
    }
    if (message.content.startsWith(`${prefix}무제한생성`)){
        if (!staff.includes(message.author.id)) return
        let license2 = randomUUID();
        const embed6 = new MessageEmbed()
        .setTitle(`${embed_name}`)
        .setColor('DBE6F6')
        .setDescription('DM을 확인해주세요.');
        message.channel.send({ embeds: [embed6] });
        const embed7 = new MessageEmbed()
        .setTitle(`${embed_name}`)
        .setColor('DBE6F6')
        .setDescription(`**${license2}**`);
        message.author.send({ embeds: [embed7] });
        const embed21 = new MessageEmbed()
        .setTitle(`${embed_name}`)
        .setColor('DBE6F6')
        .setDescription(`생성자 : <@${message.author.id}>(${message.author.tag})\n라이센스 : ||${license2}||(10년)`);
        client.channels.cache.get(`${license_log_channel}`).send({ embeds: [embed21] });
        db.prepare(`INSERT INTO license2 VALUES (?);`).run(license2);
    }
    if (message.content.startsWith(`${prefix}백업`)) {
        if(message.author.id != message.guild.ownerId){
            const embed = new MessageEmbed()
            .setTitle(`${embed_name}`)
            .setColor('DBE6F6')
            .setDescription('당신은 서버 소유권 보유자가 아닙니다.');
            return message.channel.send({ embeds: [embed] });
        }
        try {
            await message.delete()
        } catch (error) {  
        }
        console.log("[+] 서버 백업 시작됨")
        const embed16 = new MessageEmbed()
        .setTitle(`${embed_name}`)
        .setColor('DBE6F6')
        .setDescription('서버 백업이 시작되었습니다.');
        client.channels.cache.get(`${backup_log_channel}`).send({ embeds: [embed16] });
            let guild = client.guilds.cache.get(message.guild_id);
            if (guild != undefined) {
                try {
                    console.log(`[+] ${guild.name} | 백업 시작`)
                    let backup_data = await backup.create(guild, {
                        jsonBeautify: true,
                        jsonSave: true,
                    })
                    console.log(`[+] ${guild.name} | 백업 종료`)
                    db.prepare(`UPDATE guild SET filename=? WHERE guild_id=?;`).run(backup_data.id, row.guild_id);
                } catch (error) {
                }
        }
        const embed17 = new MessageEmbed()
        .setTitle(`${embed_name}`)
        .setColor('DBE6F6')
        .setDescription('서버 백업이 종료되었습니다.');
        client.channels.cache.get(`${backup_log_channel}`).send({ embeds: [embed17] });
        console.log("[+] 서버 백업 종료됨");
    }
    if (message.content.startsWith(`${prefix}올백업`)) {
        if(message.author.id != message.guild.ownerId){
            const embed = new MessageEmbed()
            .setTitle(`${embed_name}`)
            .setColor('DBE6F6')
            .setDescription('당신은 서버 소유권 보유자가 아닙니다.');
            return message.channel.send({ embeds: [embed] });
        }
        try {
            await message.delete()
        } catch (error) {  
        }
        console.log("[+] 서버 백업 시작됨")
        const embed16 = new MessageEmbed()
        .setTitle(`${embed_name}`)
        .setColor('DBE6F6')
        .setDescription('서버 백업이 시작되었습니다.');
        client.channels.cache.get(`${backup_log_channel}`).send({ embeds: [embed16] });
        let rows = db.prepare(`SELECT * FROM guild`).all();
        for (let index = 0; index < rows.length; index++){
            let row = rows[index];
            let guild = client.guilds.cache.get(row.guild_id);
            if (guild != undefined) {
                try {
                    console.log(`[+] ${guild.name} | 백업 시작`)
                    let backup_data = await backup.create(guild, {
                        jsonBeautify: true,
                        jsonSave: true,
                    })
                    console.log(`[+] ${guild.name} | 백업 종료`)
                    db.prepare(`UPDATE guild SET filename=? WHERE guild_id=?;`).run(backup_data.id, row.guild_id);
                } catch (error) {
                }
            }
        }
        const embed17 = new MessageEmbed()
        .setTitle(`${embed_name}`)
        .setColor('DBE6F6')
        .setDescription('서버 백업이 종료되었습니다.');
        client.channels.cache.get(`${backup_log_channel}`).send({ embeds: [embed17] });
        console.log("[+] 서버 백업 종료됨");

    }
    if (message.content.startsWith(`${prefix}초대`)||message.content.startsWith(`${prefix}invite`)) {
        const embed = new MessageEmbed()
        .setTitle(`${embed_name}`)
        .setColor('DBE6F6')
        .setDescription(`[SinmulServerBackup봇 초대](https://discord.com/api/oauth2/authorize?client_id=785025580814565387&permissions=8&scope=bot%20applications.commands)`)
        return message.channel.send({ embeds: [embed] });

    }
    if (message.content.startsWith(`${prefix}복구`)) {
        if (!staff.includes(message.author.id)) return
        try {
            await message.delete()
        } catch (error) {}
        const embed8 = new MessageEmbed()
        .setTitle(`${embed_name}`)
        .setColor('DBE6F6')
        .setDescription(`복구키를 입력해주세요.`);
        message.channel.send({ embeds: [embed8] });
        let message_backup_id = await message.channel.awaitMessages({
            filter: m => m.author.id === message.author.id,
            max: 1,
            time: 20000,
            errors: ["time"]
        }).catch((err) => {
            const embed9 = new MessageEmbed()
            .setTitle(`${embed_name}`)
            .setColor('DBE6F6')
            .setDescription(`시간 초과`);
            return message.channel.send({ embeds: [embed9] });
        });
        try {
            await message_backup_id.first().delete();
        } catch (error) {
        }
        let backup_code = message_backup_id.first().content
        let guild_data = db.prepare(`SELECT * FROM guild WHERE backup_code=?`).get(backup_code);
        if (guild_data == undefined) {
            const embed10 = new MessageEmbed()
            .setTitle(`${embed_name}`)
            .setColor('DBE6F6')
            .setDescription(`해당 복구키는 존재하지 않습니다.`);
            return message.channel.send({ embeds: [embed10] });
        } else { 
            if (guild_data.guild_id != message.guild.id) {
                const embed11 = new MessageEmbed()
                .setTitle(`${embed_name}`)
                .setColor('DBE6F6')
                .setDescription(`서버 복구를 시작하였습니다.\n완료되면 **DM**으로 알려드리겠습니다.`);
                message.author.send({ embeds: [embed11] });
                db.prepare(`UPDATE guild SET guild_id=? WHERE guild_id=?;`).run(message.guild.id, guild_data.guild_id);
                db.prepare(`UPDATE guild SET guild_id=? WHERE guild_id=?;`).run(message.guild.id, guild_data.guild_id);
                let guild = message.guild;
                let user = message.author;
                let guild_id = guild.id;
                let backup_code = randomUUID();
                db.prepare(`UPDATE guild SET backup_code=? WHERE guild_id=?;`).run(backup_code, guild_id);
                const embed12 = new MessageEmbed()
                .setTitle(`${embed_name}`)
                .setColor('DBE6F6')
                .setDescription(`복구키 : **${backup_code}**\n**복구키**는 복구를 할때 쓰이니 꼭 기억해주세요.`);
                message.author.send({ embeds: [embed12] });
                const embed22 = new MessageEmbed()
                .setTitle(`${embed_name}`)
                .setColor('DBE6F6')
                .setDescription(`복구자 : ${message.author.id}\n복구키 : ||${backup_code}||`);
                client.channels.cache.get(`${bac_log_channel}`).send({ embeds: [embed22] });
                try {
                    await backup.load(guild_data.filename, message.guild);
                    const embed13 = new MessageEmbed()
                    .setTitle(`${embed_name}`)
                    .setColor('DBE6F6')
                    .setDescription(`서버 복구가 완료되었습니다.\n기존 라이센스는 이동됩니다.`);
                    message.author.send({ embeds: [embed13] });
                    backup.remove(guild_data.filename);
                } catch (error) {
                    const embed14 = new MessageEmbed()
                    .setTitle(`${embed_name}`)
                    .setColor('DBE6F6')
                    .setDescription(`오류 발생으로 복구를 실패하였습니다.`);
                    message.author.send({ embeds: [embed14] });
                }
            } else {
                const embed15 = new MessageEmbed()
                .setTitle(`${embed_name}`)
                .setColor('DBE6F6')
                .setDescription(`해당 서버는 원본 서버입니다.`);
                message.author.send({ embeds: [embed15] });
            }
        }
    }
});

client.login(TOKEN);
