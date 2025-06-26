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
        // Check if roadmap name is provided
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
        
        // Get all roadmaps and find the requested one
        const allRoadmaps = getRoadmaps();
        const roadmapKey = `${guildId}_${roadmapName.toLowerCase()}`;
        const roadmap = allRoadmaps[roadmapKey];
        
        // Check if roadmap exists
        if (!roadmap) {
            const errorEmbed = new EmbedBuilder()
                .setColor(COLORS.RED)
                .setTitle('❌ Roadmap Not Found')
                .setDescription(`No roadmap named "**${roadmapName}**" exists in this server.\n\nUse \`!myroadmaps\` to see available roadmaps.`)
                .setTimestamp();
            return message.reply({ embeds: [errorEmbed] });
        }
        
        // Check if user has required role
        if (!member.roles.cache.has(roadmap.roleId)) {
            const role = message.guild.roles.cache.get(roadmap.roleId);
            const errorEmbed = new EmbedBuilder()
                .setColor(COLORS.RED)
                .setTitle('❌ Access Denied')
                .setDescription(`You don't have permission to view this roadmap.\n\n**Required Role:** ${role ? role.toString() : 'Role not found'}`)
                .setTimestamp();
            return message.reply({ embeds: [errorEmbed] });
        }
        
        // Get role information
        const role = message.guild.roles.cache.get(roadmap.roleId);
        const creator = await message.client.users.fetch(roadmap.createdBy).catch(() => null);
        
        // Calculate task statistics
        const tasks = roadmap.tasks || [];
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.status === 'completed').length;
        const pendingTasks = tasks.filter(task => task.status === 'pending').length;
        const inProgressTasks = tasks.filter(task => task.status === 'in-progress').length;
        const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        // Create main embed
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
        
        // Add progress bar
        const progressBarLength = 20;
        const filledLength = Math.round((progressPercentage / 100) * progressBarLength);
        const emptyLength = progressBarLength - filledLength;
        const progressBar = '█'.repeat(filledLength) + '░'.repeat(emptyLength);
        
        embed.addFields({
            name: '📈 Progress Bar',
            value: `\`${progressBar}\` ${progressPercentage}%`,
            inline: false
        });
        
        // Group tasks by week and then by topic
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

        // Add tasks section organized by weeks
        if (tasks.length > 0) {
            const sortedWeeks = Object.keys(tasksByWeek).sort((a, b) => parseInt(a) - parseInt(b));
            
            for (const weekNum of sortedWeeks.slice(0, 5)) { // Show max 5 weeks to prevent overflow
                const weekTopics = tasksByWeek[weekNum];
                let weekText = '';
                let totalWeekTasks = 0;
                
                // Sort topics alphabetically
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
                        
                        // Add links if they exist
                        if (task.links && task.links.length > 0) {
                            const formattedLinks = formatLinksDisplay(task.links);
                            formattedLinks.forEach(formattedLink => {
                                weekText += `    🔗 ${formattedLink}\n`;
                            });
                        } else if (task.link) {
                            const formattedLinks = formatLinksDisplay([task.link]);
                            formattedLinks.forEach(formattedLink => {
                                weekText += `    🔗 ${formattedLink}\n`;
                            });
                        }
                    }
                    weekText += '\n';
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