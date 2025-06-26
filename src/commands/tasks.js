const { EmbedBuilder } = require('discord.js');
const { COLORS } = require('../utils/embedBuilder');
const { getRoadmap } = require('../utils/dataManager');
const { formatLinksDisplay } = require('../utils/simpleLinkHandler');

module.exports = {
    name: 'tasks',
    description: 'Show all tasks in a roadmap with interactive buttons',
    usage: 'tasks [roadmap_name]',
    
    async execute(message, args) {
        try {
            const member = message.member;
            const guildId = message.guild.id;
            const { getRoadmaps } = require('../utils/dataManager');
            
            let roadmap = null;
            let roadmapKey = '';

            if (args.length === 0) {
                // No roadmap name provided, find user's accessible roadmap
                const allRoadmaps = getRoadmaps();
                const userRoadmaps = [];

                for (const [key, rm] of Object.entries(allRoadmaps)) {
                    if (key.startsWith(`${guildId}_`) && member.roles.cache.has(rm.roleId)) {
                        userRoadmaps.push({ key, roadmap: rm });
                    }
                }

                if (userRoadmaps.length === 0) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor(COLORS.RED)
                        .setTitle('❌ No Access')
                        .setDescription('You don\'t have access to any roadmaps in this server.')
                        .setTimestamp();
                    return message.reply({ embeds: [errorEmbed] });
                }

                if (userRoadmaps.length === 1) {
                    roadmap = userRoadmaps[0].roadmap;
                    roadmapKey = userRoadmaps[0].key;
                } else {
                    // Multiple roadmaps available
                    const roadmapNames = userRoadmaps.map(rm => rm.roadmap.name).join(', ');
                    const errorEmbed = new EmbedBuilder()
                        .setColor(COLORS.YELLOW)
                        .setTitle('🤔 Multiple Roadmaps Available')
                        .setDescription(`You have access to multiple roadmaps: ${roadmapNames}\n\nPlease specify which one:\n\`tasks roadmap_name\``)
                        .setTimestamp();
                    return message.reply({ embeds: [errorEmbed] });
                }
            } else {
                // Roadmap name provided
                const roadmapName = args.join(' ');
                roadmapKey = `${guildId}_${roadmapName.toLowerCase()}`;
                roadmap = getRoadmap(roadmapKey);
            }

            if (!roadmap) {
                const roadmapName = args.join(' ');
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ Roadmap Not Found')
                    .setDescription(`No roadmap named "${roadmapName}" exists in this server.`)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Check if user has required role
            if (!member.roles.cache.has(roadmap.roleId)) {
                const role = message.guild.roles.cache.get(roadmap.roleId);
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ Access Denied')
                    .setDescription(`You need the ${role ? role.toString() : 'required'} role to view tasks in this roadmap.`)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            const tasks = roadmap.tasks || [];
            const userId = message.author.id;

            // Filter tasks that user hasn't hidden
            const visibleTasks = tasks.filter(task => 
                !task.hiddenBy || !task.hiddenBy.includes(userId)
            );

            if (visibleTasks.length === 0) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.YELLOW)
                    .setTitle('📋 No Tasks')
                    .setDescription(`No visible tasks in "${roadmap.name}" roadmap.`)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Group tasks by week and topic
            const tasksByWeek = {};
            visibleTasks.forEach(task => {
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

            // Create tasks embed
            const embed = new EmbedBuilder()
                .setColor(COLORS.BLURPLE)
                .setTitle(`📋 Tasks: ${roadmap.name}`)
                .setDescription(`Total visible tasks: ${visibleTasks.length}`)
                .setTimestamp()
                .setFooter({
                    text: `${message.guild.name} | Use done task_number`,
                    iconURL: message.guild.iconURL({ dynamic: true })
                });

            // Display tasks organized by week and topic
            const sortedWeeks = Object.keys(tasksByWeek).sort((a, b) => parseInt(a) - parseInt(b));
            
            for (const weekNum of sortedWeeks.slice(0, 10)) { // Show max 10 weeks
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
                        const isCompleted = task.completedBy && task.completedBy.includes(userId);
                        const statusEmoji = isCompleted ? '✅' : '⏳';
                        
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
                
                // Check if weekText exceeds Discord's 1024 character limit
                if (weekText.length > 1024) {
                    // Split into multiple fields
                    const chunks = [];
                    let currentChunk = '';
                    const lines = weekText.split('\n');
                    
                    for (const line of lines) {
                        if ((currentChunk + line + '\n').length > 1024) {
                            if (currentChunk) chunks.push(currentChunk.trim());
                            currentChunk = line + '\n';
                        } else {
                            currentChunk += line + '\n';
                        }
                    }
                    if (currentChunk) chunks.push(currentChunk.trim());
                    
                    // Add first chunk with week name
                    embed.addFields({
                        name: `📅 Week ${weekNum}`,
                        value: chunks[0] || 'No tasks in this week.',
                        inline: false
                    });
                    
                    // Add remaining chunks
                    for (let i = 1; i < chunks.length; i++) {
                        embed.addFields({
                            name: `📅 Week ${weekNum}`,
                            value: chunks[i],
                            inline: false
                        });
                    }
                } else {
                    embed.addFields({
                        name: `📅 Week ${weekNum}`,
                        value: weekText || 'No tasks in this week.',
                        inline: false
                    });
                }
            }

            if (sortedWeeks.length > 10) {
                embed.addFields({
                    name: '📝 Note',
                    value: `... and ${sortedWeeks.length - 10} more weeks. Contact admin to see all tasks.`,
                    inline: false
                });
            }

            await message.reply({ embeds: [embed] });
        } catch (err) {
            console.error('Error in tasks command:', err);
        }
    }
};