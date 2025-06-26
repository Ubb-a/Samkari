const { EmbedBuilder } = require('discord.js');
const { COLORS } = require('../utils/embedBuilder');
const { getRoadmap, saveRoadmap, readData, writeData } = require('../utils/dataManager');

module.exports = {
    name: 'schedule',
    description: 'Schedule weekly tasks for a roadmap',
    usage: '!schedule <roadmap_name> | <task_title> | <task_description> | <day_of_week>',
    
    async execute(message, args) {
        try {
            // Check if user has manage roles permission (admin check)
            if (!message.member.permissions.has('ManageRoles')) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ Access Denied')
                    .setDescription('This command is for admins only who have "Manage Roles" permission.')
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Check if arguments are provided
            if (args.length === 0) {
                const helpEmbed = new EmbedBuilder()
                    .setColor(COLORS.BLURPLE)
                    .setTitle('📅 Weekly Task Scheduling')
                    .setDescription(`**Usage:** ${this.usage}\n\n**Available Days:**\n• monday\n• tuesday\n• wednesday\n• thursday\n• friday\n• saturday\n• sunday\n\n**Example:**\n\`schedule web-dev | Weekly Review | Review completed tasks this week | monday\``)
                    .addFields(
                        {
                            name: '🔍 Other Commands',
                            value: '• `schedule list` - View all scheduled tasks\n• `schedule remove <id>` - Delete scheduled task',
                            inline: false
                        }
                    )
                    .setTimestamp();
                return message.reply({ embeds: [helpEmbed] });
            }

            const subCommand = args[0].toLowerCase();

            // Handle list command  
            if (subCommand === 'list') {
                return await this.listScheduledTasks(message);
            }

            // Handle remove command
            if (subCommand === 'remove') {
                return await this.removeScheduledTask(message, args.slice(1));
            }

            // Handle main schedule command
            const fullArgs = args.join(' ');
            const parts = fullArgs.split(' | ');

            if (parts.length !== 4) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ استخدام خاطئ')
                    .setDescription(`**الاستخدام:** ${this.usage}\n**مثال:** \`schedule web-dev | مراجعة أسبوعية | راجع المهام المكتملة | monday\``)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            const [roadmapName, taskTitle, taskDescription, dayOfWeek] = parts.map(part => part.trim());

            // Validate day of week
            const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            if (!validDays.includes(dayOfWeek.toLowerCase())) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ يوم غير صحيح')
                    .setDescription(`**الأيام المتاحة:** ${validDays.join(', ')}\n**تم إدخال:** ${dayOfWeek}`)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Check if roadmap exists
            const guildId = message.guild.id;
            const roadmapKey = `${guildId}_${roadmapName.toLowerCase()}`;
            const roadmap = getRoadmap(roadmapKey);

            if (!roadmap) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ الرود ماب مش موجودة')
                    .setDescription(`مفيش رود ماب بالاسم "${roadmapName}" في السيرفر ده.\n\nاستعمل \`!myroadmaps\` عشان تشوف الرود ماب الموجودة.`)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Create scheduled task
            const data = readData();
            if (!data.scheduledTasks) {
                data.scheduledTasks = {};
            }

            const scheduleId = Date.now().toString();
            const scheduledTask = {
                id: scheduleId,
                guildId: guildId,
                roadmapKey: roadmapKey,
                roadmapName: roadmapName,
                taskTitle: taskTitle,
                taskDescription: taskDescription,
                dayOfWeek: dayOfWeek.toLowerCase(),
                createdBy: message.author.id,
                createdAt: new Date().toISOString(),
                isActive: true
            };

            data.scheduledTasks[scheduleId] = scheduledTask;
            writeData(data);

            // Success message
            const dayNames = {
                monday: 'الإثنين',
                tuesday: 'الثلاثاء',
                wednesday: 'الأربعاء',
                thursday: 'الخميس',
                friday: 'الجمعة',
                saturday: 'السبت',
                sunday: 'الأحد'
            };

            const successEmbed = new EmbedBuilder()
                .setColor(COLORS.GREEN)
                .setTitle('✅ تم جدولة المهمة بنجاح!')
                .setDescription(`**الرود ماب:** ${roadmapName}\n**المهمة:** ${taskTitle}\n**الوصف:** ${taskDescription}\n**اليوم:** ${dayNames[dayOfWeek.toLowerCase()]}\n\n🔄 المهمة دي هتتضاف تلقائي كل ${dayNames[dayOfWeek.toLowerCase()]}`)
                .setTimestamp()
                .setFooter({ text: `Schedule ID: ${scheduleId}` });

            await message.reply({ embeds: [successEmbed] });

        } catch (err) {
            console.error('Error in schedule command:', err);
            const errorEmbed = new EmbedBuilder()
                .setColor(COLORS.RED)
                .setTitle('❌ Error Occurred')
                .setDescription('Could not schedule the task. Please try again.')
                .setTimestamp();
            await message.reply({ embeds: [errorEmbed] }).catch(console.error);
        }
    },

    async listScheduledTasks(message) {
        const data = readData();
        const scheduledTasks = data.scheduledTasks || {};
        const guildTasks = Object.values(scheduledTasks).filter(task => 
            task.guildId === message.guild.id && task.isActive
        );

        if (guildTasks.length === 0) {
            const embed = new EmbedBuilder()
                .setColor(COLORS.YELLOW)
                .setTitle('📅 Scheduled Tasks')
                .setDescription('No scheduled tasks in this server.')
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }

        const dayNames = {
            monday: 'Monday',
            tuesday: 'Tuesday',
            wednesday: 'Wednesday',
            thursday: 'Thursday',
            friday: 'Friday',
            saturday: 'Saturday',
            sunday: 'الأحد'
        };

        let description = '';
        guildTasks.forEach((task, index) => {
            description += `**${index + 1}.** ${task.taskTitle}\n`;
            description += `   📍 الرود ماب: ${task.roadmapName}\n`;
            description += `   📅 اليوم: ${dayNames[task.dayOfWeek]}\n`;
            description += `   🆔 المعرف: \`${task.id}\`\n\n`;
        });

        const embed = new EmbedBuilder()
            .setColor(COLORS.BLURPLE)
            .setTitle('📅 المهام المجدولة')
            .setDescription(description)
            .setTimestamp()
            .setFooter({ text: `إجمالي: ${guildTasks.length} مهمة مجدولة` });

        await message.reply({ embeds: [embed] });
    },

    async removeScheduledTask(message, args) {
        if (args.length === 0) {
            const errorEmbed = new EmbedBuilder()
                .setColor(COLORS.RED)
                .setTitle('❌ معرف المهمة مفقود')
                .setDescription('**الاستخدام:** `schedule remove <id>`\n**مثال:** `schedule remove 1704067200000`')
                .setTimestamp();
            return message.reply({ embeds: [errorEmbed] });
        }

        const taskId = args[0];
        const data = readData();
        const scheduledTasks = data.scheduledTasks || {};

        if (!scheduledTasks[taskId] || scheduledTasks[taskId].guildId !== message.guild.id) {
            const errorEmbed = new EmbedBuilder()
                .setColor(COLORS.RED)
                .setTitle('❌ المهمة مش موجودة')
                .setDescription(`مفيش مهمة مجدولة بالمعرف "${taskId}" في السيرفر ده.`)
                .setTimestamp();
            return message.reply({ embeds: [errorEmbed] });
        }

        const task = scheduledTasks[taskId];
        task.isActive = false;
        writeData(data);

        const successEmbed = new EmbedBuilder()
            .setColor(COLORS.GREEN)
            .setTitle('✅ تم حذف المهمة المجدولة')
            .setDescription(`**المهمة:** ${task.taskTitle}\n**الرود ماب:** ${task.roadmapName}\n\n🗑️ المهمة دي مش هتتضاف تاني تلقائي.`)
            .setTimestamp();

        await message.reply({ embeds: [successEmbed] });
    }
};