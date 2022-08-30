const { Permissions } = require('discord.js');
const { TOKEN, staff, embed_name, backup_log_channel, license_log_channel, ba_log_channel, bac_log_channel, prefix } = require('../config.json')

module.exports = {
    name: "청소",
    async execute(message, args) {
        if (!staff.includes(message.author.id)) return await message.delete()
            const messagechannel = message.channel
            const count = args[0]
            if (isNaN(args[0])) return message.reply("올바른 값을 입력해주세요")
            if (!message.member.permissions.has([Permissions.FLAGS.MANAGE_MESSAGES, Permissions.FLAGS.KICK_MEMBERS])) return message.reply("권한이 없습니다")
            if (count < 0 || count > 99) return message.reply("1에서 100미만의 수를 입력해주세요")
                await messagechannel.bulkDelete(count, true).then((count) => {
                    message.channel.send({ content: `${message.author}의 의해 ${count.size}개의 메세지를 삭제했습니다` }).then((msg) => setTimeout(() => { msg.delete() }, 2000))
                })

    }
}