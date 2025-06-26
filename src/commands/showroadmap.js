const { EmbedBuilder } = require('discord.js');
const { COLORS } = require('../utils/embedBuilder');
const { getRoadmaps } = require('../utils/dataManager');
const { formatLinksDisplay } = require('../utils/simpleLinkHandler');

module.exports = {
    name: 'showroadmap',
    description: 'Display detailed information about a specific roadmap',
    usage: '!showroadmap <roadmap_name>',
    
    async execute(message, args) {
        try {
            if (args.length === 0) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ Missing Roadmap Name')
                    .setDescription(`**Usage:** ${this.usage}\n**Example:** \`!showroadmap web-dev\``)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }
            
            const roadmapName = args.join(' ');
            const member = message.member;
            const guildId = message.guild.id;
            
            const allRoadmaps = getRoadmaps();
            const roadmapKey = `${guildId}_${roadmapName.toLowerCase()}`;
            const roadmap = allRoadmaps[roadmapKey];
            
            if (!roadmap) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ Roadmap Not Found')
                    .setDescription(`No roadmap named "**${roadmapName}**" exists in this server.\n\nUse \`!myroadmaps\` to see available roadmaps.`)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }
            
            if (!member.roles.cache.has(roadmap.roleId)) {
                const role = message.guild.roles.cache.get(roadmap.roleId);
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ Access Denied')
                    .setDescription(`You don't have permission to view this roadmap.\n\n**Required Role:** ${role ? role.toString() : 'Role not found'}`)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }
            
            const role = message.guild.roles.cache.get(roadmap.roleId);
            const creator = await message.client.users.fetch(roadmap.createdBy).catch(() => null);
            
            const tasks = roadmap.tasks || [];
            const totalTasks = tasks.length;
            const completedTasks = tasks.filter(task => task.status === 'completed').length;
            const pendingTasks = tasks.filter(task => task.status === 'pending').length;
            const inProgressTasks = tasks.filter(task => task.status === 'in-progress').length;
            const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            
            const embed = new EmbedBuilder()
                .setColor(COLORS.BLURPLE)
                .setTitle(`🗺️ ${roadmap.name}`)
                .setDescription(`**Progress:** ${progressPercentage}% (${completedTasks}/${totalTasks} tasks completed)`)
                .addFields(
                    {
                        name: '🏷️ Required Role',
                        value: role ? role.toString() : 'Role not found',
                        inline: true
                    },
                    {
                        name: '👤 Created by',
                        value: creator ? creator.tag : 'Unknown user',
                        inline: true
                    },
                    {
                        name: '📅 Created Date',
                        value: new Date(roadmap.createdAt).toLocaleDateString('en-US'),
                        inline: true
                    },
                    {
                        name: '📊 Task Statistics',
                        value: `✅ Completed: ${completedTasks}\n🔄 In Progress: ${inProgressTasks}\n⏳ Pending: ${pendingTasks}`,
                        inline: false
                    }
                )
                .setTimestamp()
                .setFooter({
                    text: `${message.guild.name} | Roadmap ID: ${roadmap.id}`,
                    iconURL: message.guild.iconURL({ dynamic: true })
                });
            
            const progressBarLength = 20;
            const filledLength = Math.round((progressPercentage / 100) * progressBarLength);
            const emptyLength = progressBarLength - filledLength;
            const progressBar = '█'.repeat(filledLength) + '░'.repeat(emptyLength);
            
            embed.addFields({
                name: '📈 Progress Bar',
                value: `\`${progressBar}\` ${progressPercentage}%`,
                inline: false
            });
            
            const tasksByWeek = {};
            tasks.forEach(task => {
                const week = task.weekNumber || 1;
                const topic = task.topic || 'General';
                
                if (!tasksByWeek[week]) {
                    tasksByWeek[week] = {};
                }
                if (!tasksByWeek[week][topic]) {
                    tasksByWeek[week][topic] = [];
                }
                tasksByWeek[week][topic].push(task);
            });

            if (tasks.length > 0) {
                const sortedWeeks = Object.keys(tasksByWeek).sort((a, b) => parseInt(a) - parseInt(b));
                
                for (const weekNum of sortedWeeks.slice(0, 5)) {
                    const weekTopics = tasksByWeek[weekNum];
                    let weekText = '';
                    let totalWeekTasks = 0;
                    
                    const sortedTopics = Object.keys(weekTopics).sort();
                    
                    for (const topicName of sortedTopics) {
                        const topicTasks = weekTopics[topicName];
                        totalWeekTasks += topicTasks.length;
                        
                        weekText += `**📚 ${topicName}:**\n`;
                        
                        for (const task of topicTasks) {
                            let statusEmoji = '';
                            switch (task.status) {
                                case 'completed':
                                    statusEmoji = '✅';
                                    break;
                                case 'in-progress':
                                    statusEmoji = '🔄';
                                    break;
                                default:
                                    statusEmoji = '⏳';
                            }

                            weekText += `  ${statusEmoji} **${task.id}.** ${task.title}\n`;

                            // Add links if any
                            if (task.links && task.links.length > 0) {
                                weekText += formatLinksDisplay(task.links) + '\n';
                            }
                        }
                    }

                    embed.addFields({
                        name: `📅 Week ${weekNum} (${totalWeekTasks} tasks)`,
                        value: weekText || 'No tasks in this week.',
                        inline: false
                    });
                }

                if (sortedWeeks.length > 5) {
                    embed.addFields({
                        name: '📝 Note',
                        value: `... and ${sortedWeeks.length - 5} more weeks. Use \`tasks ${roadmap.name}\` to see all tasks.`,
                        inline: false
                    });
                }
            } else {
                embed.addFields({
                    name: '📋 Tasks',
                    value: 'No tasks have been added to this roadmap yet.',
                    inline: false
                });
            }
            
            await message.reply({ embeds: [embed] });

        } catch (err) {
            console.error('Error in showroadmap command:', err);
        }
    }
};
