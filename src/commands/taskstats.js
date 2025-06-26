const { EmbedBuilder } = require('discord.js');
const { COLORS } = require('../utils/embedBuilder');
const { getRoadmap } = require('../utils/dataManager');

module.exports = {
    name: 'taskstats',
    description: 'Show admin statistics for task interactions',
    usage: '!taskstats <roadmap_name>',
    
    async execute(message, args) {
        try {
            // Check if user has manage roles permission (admin check)
            if (!message.member.permissions.has('ManageRoles')) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ ممنوع الوصول')
                    .setDescription('هذا الأمر متاح فقط للإداريين الذين لديهم صلاحية "إدارة الأدوار".')
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Check if roadmap name is provided
            if (args.length === 0) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ اسم الرود ماب مفقود')
                    .setDescription(`**الاستخدام:** ${this.usage}\n**مثال:** \`!taskstats تطوير-المواقع\``)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            const roadmapName = args.join(' ');
            const guildId = message.guild.id;

            // Get roadmap
            const roadmapKey = `${guildId}_${roadmapName.toLowerCase()}`;
            const roadmap = getRoadmap(roadmapKey);

            if (!roadmap) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ الرود ماب مش موجودة')
                    .setDescription(`مفيش رود ماب بالاسم "${roadmapName}" في السيرفر ده.`)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            const tasks = roadmap.tasks || [];

            if (tasks.length === 0) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.YELLOW)
                    .setTitle('📋 لا توجد مهام')
                    .setDescription(`مفيش مهام في الرود ماب "${roadmap.name}".`)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Create main statistics embed
            const statsEmbed = new EmbedBuilder()
                .setColor(COLORS.BLURPLE)
                .setTitle(`📊 إحصائيات المهام - ${roadmap.name}`)
                .setDescription(`تفاصيل تفاعل الأعضاء مع المهام`)
                .setTimestamp()
                .setFooter({
                    text: `${message.guild.name} | إحصائيات الإدارة`,
                    iconURL: message.guild.iconURL({ dynamic: true })
                });

            // Overall statistics
            let totalCompletions = 0;
            let activeUsers = new Set();

            tasks.forEach(task => {
                if (task.completedBy) {
                    totalCompletions += task.completedBy.length;
                    task.completedBy.forEach(userId => activeUsers.add(userId));
                }
            });

            statsEmbed.addFields({
                name: '📈 إحصائيات عامة',
                value: `**إجمالي المهام:** ${tasks.length}\n**إجمالي الإنجازات:** ${totalCompletions}\n**المستخدمين النشطين:** ${activeUsers.size}`,
                inline: false
            });

            // Task-by-task breakdown
            let taskDetails = '';
            for (let i = 0; i < Math.min(tasks.length, 8); i++) {
                const task = tasks[i];
                const taskEmoji = task.emoji || '📝';
                const completedCount = task.completedBy ? task.completedBy.length : 0;
                const hiddenCount = task.hiddenBy ? task.hiddenBy.length : 0;
                
                // Show completed users
                let completedUsers = '';
                if (task.completedBy && task.completedBy.length > 0) {
                    const userNames = task.completedBy.map(userId => {
                        const member = message.guild.members.cache.get(userId);
                        return member ? member.displayName : `User ${userId}`;
                    }).slice(0, 3); // Show max 3 names
                    completedUsers = userNames.join(', ');
                    if (task.completedBy.length > 3) completedUsers += ` +${task.completedBy.length - 3}`;
                }
                
                taskDetails += `${i + 1}. **${task.title}**\n`;
                taskDetails += `   ✅ مكتملة: ${completedCount}`;
                if (completedUsers) taskDetails += ` (${completedUsers})`;
                taskDetails += `\n\n`;
            }

            if (taskDetails) {
                statsEmbed.addFields({
                    name: '📋 تفاصيل المهام',
                    value: taskDetails,
                    inline: false
                });
            }

            await message.reply({ embeds: [statsEmbed] });

            // Send detailed user interactions if there are any
            if (activeUsers.size > 0) {
                const detailsEmbed = new EmbedBuilder()
                    .setColor(COLORS.GREEN)
                    .setTitle('👥 تفاصيل تفاعل المستخدمين')
                    .setTimestamp();

                let userDetails = '';
                let userCount = 0;
                
                for (const userId of activeUsers) {
                    if (userCount >= 10) break; // Limit to prevent message being too long
                    
                    const member = message.guild.members.cache.get(userId);
                    const memberName = member ? member.displayName : `User ${userId}`;
                    
                    const completedTasks = tasks.filter(task => 
                        task.completedBy && task.completedBy.includes(userId)
                    );
                    
                    if (completedTasks.length > 0) {
                        userDetails += `**${memberName}:** ${completedTasks.length} مهمة مكتملة\n`;
                        userCount++;
                    }
                }

                if (userDetails) {
                    detailsEmbed.setDescription(userDetails);
                    await message.channel.send({ embeds: [detailsEmbed] }).catch(console.error);
                }
            }

        } catch (err) {
            console.error('Error in taskstats command:', err);
        }
    }
};