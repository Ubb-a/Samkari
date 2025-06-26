const { EmbedBuilder } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed } = require('../utils/embedBuilder');

module.exports = {
    name: 'poll',
    description: 'عمل استطلاع رأي مع خيارات متعددة',
    async execute(message, args) {
        try {
            if (!message.member.permissions.has('ManageRoles')) {
                const errorEmbed = createErrorEmbed(
                    'مش مسموح ليك',
                    'محتاج صلاحية "Manage Roles" عشان تعمل استطلاع رأي.'
                );
                return message.reply({ embeds: [errorEmbed] });
            }

            if (args.length < 3) {
                const errorEmbed = createErrorEmbed(
                    'معلومات ناقصة',
                    '**الاستخدام:** `poll <السؤال> , <خيار1> , <خيار2> , ...`\n\n**مثال:** `poll إيه أحسن لغة برمجة؟ , JavaScript , Python , Java`'
                );
                return message.reply({ embeds: [errorEmbed] });
            }

            const input = args.join(' ');
            const parts = input.split(',').map(part => part.trim());
            
            if (parts.length < 3) {
                const errorEmbed = createErrorEmbed(
                    'خيارات قليلة',
                    'محتاج على الأقل سؤال وخيارين للاستطلاع.\n\n**مثال:** `poll إيه أحسن لغة؟ , JavaScript , Python`'
                );
                return message.reply({ embeds: [errorEmbed] });
            }

            const question = parts[0];
            const options = parts.slice(1);

            if (options.length > 10) {
                const errorEmbed = createErrorEmbed(
                    'خيارات كتير',
                    'أقصى عدد خيارات هو 10 خيارات.'
                );
                return message.reply({ embeds: [errorEmbed] });
            }

            const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
            
            let optionsText = '';
            for (let i = 0; i < options.length; i++) {
                optionsText += `\n${emojis[i]} ${options[i]}`;
            }

            const pollEmbed = new EmbedBuilder()
                .setColor(0x57F287)
                .setTitle('📊 استطلاع رأي')
                .setDescription(`**${question}**\n${optionsText}\n\n*اضغط على الرمز المناسب للتصويت*`)
                .setFooter({ text: `استطلاع من ${message.author.username}` })
                .setTimestamp();

            const pollMessage = await message.channel.send({ embeds: [pollEmbed] });

            // إضافة الرموز للتصويت
            for (let i = 0; i < options.length; i++) {
                await pollMessage.react(emojis[i]);
            }

            // حذف رسالة الأمر الأصلية
            if (message.deletable) {
                await message.delete();
            }

        } catch (error) {
            console.error('Error creating poll:', error);
            const errorEmbed = createErrorEmbed(
                'خطأ في النظام',
                'حصل خطأ وأنت بتعمل الاستطلاع. جرب تاني.'
            );
            return message.reply({ embeds: [errorEmbed] });
        }
    }
};