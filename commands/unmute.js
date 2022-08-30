const { Permissions , MessageEmbed } = require("discord.js")
const { TOKEN, staff, embed_name, backup_log_channel, license_log_channel, ba_log_channel, bac_log_channel, prefix } = require('../config.json')

const permissionsembed = new MessageEmbed()
.setTitle("❌오류❌")
.setDescription(`해당 명령어는 MANAGE_CHANNELS 또는 MANAGE_ROLES 권한이 있어야합니다!`)
.setColor('RED')

module.exports = {
    name: "언뮤트",
    async execute(message , args) {
        if (!message.guild.me.permissions.has(Permissions.FLAGS.MANAGE_CHANNELS) || !message.guild.me.permissions.has(Permissions.FLAGS.MANAGE_ROLES))
            return message.reply({embeds : [permissionsembed]})

        const target = message.mentions.members.first() || message.guild.members.cache.get(args[0])

        if(!target){
            const targetnull = new MessageEmbed()
            .setTitle("❌오류❌")
            .setDescription(`유저를 맨션해주세요!\n-언뮤트 <맨션|유저ID> <사유>`)
            .setColor('RED')

            return message.reply({embeds : [targetnull]})
        }

        // let reason = args.slice(1).join(" ");
        // if (!reason) reason = "사유 없음"
        
        const muterole = message.channel.guild.roles.cache.find(r => r.name == "뮤트")

        if(!muterole){
            const role = await message.guild.roles.create({ name: "뮤트", reason: `Mute Role`, color: "BLUE" })
            message.guild.channels.cache.forEach(channel => {
                channel.permissionOverwrites.edit(role, { SEND_MESSAGES: false, SPEAK: false, ADD_REACTIONS: false, SEND_TTS_MESSAGES: false, ATTACH_FILES: false })
            })
        }

        const a = target?.roles?.cache?.find(r => r.name == "뮤트")
        if(a){
        target.roles.remove(muterole.id).then(() => {
            const embed = new MessageEmbed()
                .setColor(0xFF90FF)
                .setTitle(`🔈언뮤트🔈`)
                .setDescription(`유저: ${target.user.username} \n처리자: ${message.author}`)
                .setTimestamp()
            message.reply({embeds : [embed]})
        })
    } else {
        const embed = new MessageEmbed()
.setTitle("❌오류❌")
.setDescription(`유저: ${target.user.username}은(는) \`뮤트\`역할이 없습니다.`)
.setColor('RED')
message.reply({embed: [embed]})
    }
    }
}