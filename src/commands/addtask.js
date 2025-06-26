const { EmbedBuilder } = require('discord.js');
const { COLORS } = require('../utils/embedBuilder');
const { getRoadmap, saveRoadmap } = require('../utils/dataManager');

module.exports = {
    name: 'addtask',
    description: 'Add a new task to a roadmap with topic organization',
    usage: 'addtask <roadmap_name> <week_number> <topic_name> <task_title> [link: url1,url2]',
    
    async execute(message, args) {
        try {
            // Check if user is mentioned or has manage roles permission
            const mentionedUsers = message.mentions.users;
            const hasManageRoles = message.member.permissions.has('ManageRoles');
            
            if (!hasManageRoles && !mentionedUsers.has(message.author.id)) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ Access Denied')
                    .setDescription('You need "Manage Roles" permission or mention to add tasks.')
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Check if arguments are provided
            if (args.length < 4) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ Missing Arguments')
                    .setDescription(`**Usage:** ${this.usage}\n**Example:** \`addtask web-dev 2 JavaScript Learn Node.js link: https://nodejs.org,https://github.com\`\n\n**Note:** Week number from 1 to 52.`)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            const roadmapName = args[0];
            const weekNumber = parseInt(args[1]);
            const topicName = args[2];
            
            // Parse task title and links
            const remainingArgs = args.slice(3);
            let taskTitle = '';
            let taskLinks = [];
            
            for (let i = 0; i < remainingArgs.length; i++) {
                const arg = remainingArgs[i];
                if (arg.startsWith('link:')) {
                    const linkString = arg.substring(5);
                    taskLinks = linkString.split(',').map(link => link.trim()).filter(link => link);
                    break;
                } else {
                    taskTitle += (taskTitle ? ' ' : '') + arg;
                }
            }

            // Validate inputs
            if (!roadmapName || !taskTitle) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ Missing Data')
                    .setDescription('Make sure to write roadmap name, week number and task title.')
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Validate week number
            if (isNaN(weekNumber) || weekNumber < 1 || weekNumber > 52) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ رقم أسبوع غير صحيح')
                    .setDescription('رقم الأسبوع لازم يكون رقم من 1 لـ 52.')
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Get roadmap
            const roadmapKey = `${message.guild.id}_${roadmapName.toLowerCase()}`;
            const roadmap = getRoadmap(roadmapKey);

            if (!roadmap) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ Roadmap Not Found')
                    .setDescription(`No roadmap named "${roadmapName}" exists in this server.`)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Find the highest ID in the same topic to maintain order
            const topicTasks = roadmap.tasks.filter(task => 
                task.weekNumber === weekNumber && task.topic === topicName
            );
            
            // Create new task object
            const newTaskId = roadmap.tasks.length > 0 ? Math.max(...roadmap.tasks.map(t => t.id)) + 1 : 1;
            
            const newTask = {
                id: newTaskId,
                title: taskTitle,
                topic: topicName,
                weekNumber: weekNumber,
                status: 'pending',
                createdAt: new Date().toISOString(),
                createdBy: message.author.id,
                completedBy: [],
                hiddenBy: []
            };
            
            // Add links if provided
            if (taskLinks.length > 0) {
                newTask.links = taskLinks;
            }

            // Add task to roadmap
            roadmap.tasks.push(newTask);
            saveRoadmap(roadmapKey, roadmap);

            const successEmbed = new EmbedBuilder()
                .setColor(COLORS.GREEN)
                .setTitle('✅ Task Added Successfully!')
                .setDescription(`**Task:** ${taskTitle}\n**Topic:** ${topicName}\n**Week:** ${weekNumber}\n**Roadmap:** ${roadmapName}`)
                .addFields([
                    {
                        name: '📋 Task Details',
                        value: `**ID:** ${newTask.id}\n**Status:** Pending${taskLinks.length > 0 ? `\n**Links:** ${taskLinks.length} link(s)` : ''}`,
                        inline: false
                    }
                ])
                .setTimestamp()
                .setFooter({
                    text: `Added by ${message.author.tag}`,
                    iconURL: message.author.displayAvatarURL({ dynamic: true })
                });

            await message.reply({ embeds: [successEmbed] });

        } catch (err) {
            console.error('Error in addtask command:', err);
        }
    }
};