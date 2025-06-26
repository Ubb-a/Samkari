const { EmbedBuilder } = require('discord.js');
const { COLORS } = require('../utils/embedBuilder');
const { getRoadmap, saveRoadmap, getRoadmaps } = require('../utils/dataManager');

module.exports = {
    name: 'undo',
    description: 'Undo task completion - removes your completion from a task',
    usage: 'undo <task_id> [roadmap_name]',
    
    async execute(message, args) {
        try {
            if (args.length === 0) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ Task Number Missing')
                    .setDescription(`**Usage:** ${this.usage}\n**Example:** \`undo 2\` or \`undo 2 backend\``)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            const taskId = parseInt(args[0]);
            if (isNaN(taskId) || taskId < 1) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ Invalid ID')
                    .setDescription('Please enter a valid task ID (1, 2, 3...)')
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            const member = message.member;
            const guildId = message.guild.id;
            const userId = message.author.id;

            let targetRoadmap = null;
            let roadmapKey = '';

            // If roadmap name is provided, use it
            if (args.length > 1) {
                const roadmapName = args.slice(1).join(' ');
                roadmapKey = `${guildId}_${roadmapName.toLowerCase()}`;
                targetRoadmap = getRoadmap(roadmapKey);

                if (!targetRoadmap) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor(COLORS.RED)
                        .setTitle('❌ Roadmap Not Found')
                        .setDescription(`No roadmap named "${roadmapName}" exists in this server.`)
                        .setTimestamp();
                    return message.reply({ embeds: [errorEmbed] });
                }
            } else {
                // Find roadmap from user's accessible roadmaps
                const allRoadmaps = getRoadmaps();
                const userRoadmaps = [];

                for (const [key, roadmap] of Object.entries(allRoadmaps)) {
                    if (key.startsWith(`${guildId}_`) && member.roles.cache.has(roadmap.roleId)) {
                        userRoadmaps.push({ key, roadmap });
                    }
                }

                if (userRoadmaps.length === 0) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor(COLORS.RED)
                        .setTitle('❌ No Available Roadmaps')
                        .setDescription('You don\'t have permission to access any roadmap in this server.')
                        .setTimestamp();
                    return message.reply({ embeds: [errorEmbed] });
                }

                if (userRoadmaps.length === 1) {
                    targetRoadmap = userRoadmaps[0].roadmap;
                    roadmapKey = userRoadmaps[0].key;
                } else {
                    // Multiple roadmaps available, ask user to specify
                    const roadmapNames = userRoadmaps.map(rm => rm.roadmap.name).join(', ');
                    const errorEmbed = new EmbedBuilder()
                        .setColor(COLORS.YELLOW)
                        .setTitle('🤔 Multiple Roadmaps Available')
                        .setDescription(`You have access to multiple roadmaps: ${roadmapNames}\n\nPlease specify the roadmap name:\n\`undo ${taskId} roadmap_name\``)
                        .setTimestamp();
                    return message.reply({ embeds: [errorEmbed] });
                }
            }

            // Check if user has required role
            if (!member.roles.cache.has(targetRoadmap.roleId)) {
                const role = message.guild.roles.cache.get(targetRoadmap.roleId);
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ Access Denied')
                    .setDescription(`You need the ${role ? role.toString() : 'required'} role to interact with tasks in this roadmap.`)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            const tasks = targetRoadmap.tasks || [];
            
            // Find the task by ID (we need to find it even if hidden to allow undo)
            const task = targetRoadmap.tasks.find(t => t.id === taskId);
            
            if (!task) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ Task Not Found')
                    .setDescription(`No task with ID ${taskId} found in the roadmap.`)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            if (!task.completedBy) task.completedBy = [];
            const isCompleted = task.completedBy.includes(userId);

            if (!isCompleted) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.YELLOW)
                    .setTitle('⚠️ Task Not Completed')
                    .setDescription(`You haven't completed task ${taskId} yet, so there's nothing to undo.`)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Remove user from completedBy array
            task.completedBy = task.completedBy.filter(id => id !== userId);
            
            // If task was hidden and user undoes completion, unhide it for them
            if (task.hiddenBy && task.hiddenBy.includes(userId)) {
                task.hiddenBy = task.hiddenBy.filter(id => id !== userId);
            }
            
            saveRoadmap(roadmapKey, targetRoadmap);

            const successEmbed = new EmbedBuilder()
                .setColor('#FF8C00')
                .setTitle('↩️ Task Completion Undone!')
                .setDescription(`**Task:** ${task.title}\n**Topic:** ${task.topic || 'General'}\n**Roadmap:** ${targetRoadmap.name}`)
                .addFields([
                    {
                        name: '🎯 Details',
                        value: `**Task ID:** ${taskId}\n**Status:** Completion removed\n**Week:** ${task.weekNumber || 'Not specified'}`,
                        inline: false
                    },
                    {
                        name: '💡 Note',
                        value: 'Task is now marked as incomplete and visible in your task list again.',
                        inline: false
                    }
                ])
                .setTimestamp()
                .setFooter({
                    text: `Undone by ${message.author.tag}`,
                    iconURL: message.author.displayAvatarURL({ dynamic: true })
                });

            await message.reply({ embeds: [successEmbed] });

        } catch (err) {
            console.error('Error in undo command:', err);
        }
    }
};