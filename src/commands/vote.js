const { EmbedBuilder } = require('discord.js');
const { COLORS } = require('../utils/embedBuilder');

module.exports = {
    name: 'vote',
    description: 'Create a simple yes/no vote with reactions',
    usage: '!vote <السؤال أو الموضوع>',
    
    async execute(message, args) {
        try {
            // Check if user has manage roles permission (admin check)
            if (!message.member.permissions.has('ManageRoles')) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ ممنوع الوصول')
                    .setDescription('الأمر ده للأدمن بس اللي عندهم صلاحية "إدارة الأدوار".')
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Check if question is provided
            if (args.length === 0) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ السؤال مفقود')
                    .setDescription(`**الاستخدام:** ${this.usage}\n**مثال:** \`vote هل نغير لون السيرفر؟\``)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            const question = args.join(' ');

            // Create vote embed
            const voteEmbed = new EmbedBuilder()
                .setColor(COLORS.BLURPLE)
                .setTitle('🗳️ تصويت جديد')
                .setDescription(`**${question}**\n\n✅ = موافق\n❌ = مش موافق\n\nصوت باستخدام الايموجي تحت ⬇️`)
                .setAuthor({
                    name: `تم الإنشاء بواسطة ${message.author.displayName}`,
                    iconURL: message.author.displayAvatarURL({ dynamic: true })
                })
                .setTimestamp()
                .setFooter({
                    text: `${message.guild.name} | تصويت بسيط`,
                    iconURL: message.guild.iconURL({ dynamic: true })
                });

            // Send the vote embed
            const voteMessage = await message.channel.send({ embeds: [voteEmbed] });

            // Add reactions for voting
            await voteMessage.react('✅');
            await voteMessage.react('❌');

            // Delete the original command message to keep things clean
            try {
                await message.delete();
            } catch (error) {
                // Ignore if can't delete (no permissions)
            }

        } catch (err) {
            console.error('Error in vote command:', err);
            const errorEmbed = new EmbedBuilder()
                .setColor(COLORS.RED)
                .setTitle('❌ حصل خطأ')
                .setDescription('مقدرتش أعمل التصويت. جرب تاني.')
                .setTimestamp();
            await message.reply({ embeds: [errorEmbed] }).catch(console.error);
        }
    }
};