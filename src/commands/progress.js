const { EmbedBuilder } = require('discord.js');
const { COLORS } = require('../utils/embedBuilder');
const { getRoadmap, getRoadmaps } = require('../utils/dataManager');

module.exports = {
    name: 'progress',
    description: 'Show your completion progress percentage for a roadmap',
    usage: 'progress [roadmap_name]',
    
    async execute(message, args) {
        try {
            const member = message.member;
            const guildId = message.guild.id;
            let userId = message.author.id;
            let targetUser = message.author;

            // Check if user mentioned someone else to view their progress
            const mentionedUser = message.mentions.users.first();
            if (mentionedUser) {
                userId = mentionedUser.id;
                targetUser = mentionedUser;
                // Remove mention from args for roadmap name processing
                args = args.filter(arg => !arg.startsWith('<@'));
            }

            let targetRoadmap = null;
            let roadmapKey = '';

            // If roadmap name is provided, use it
            if (args.length > 0) {
                const roadmapName = args.join(' ');
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

                // Get the target member (either mentioned user or command author)
                const targetMember = mentionedUser ? message.guild.members.cache.get(mentionedUser.id) : member;

                for (const [key, roadmap] of Object.entries(allRoadmaps)) {
                    if (key.startsWith(`${guildId}_`) && targetMember && targetMember.roles.cache.has(roadmap.roleId)) {
                        userRoadmaps.push({ key, roadmap });
                    }
                }

                if (userRoadmaps.length === 0) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor(COLORS.RED)
                        .setTitle('❌ No Available Roadmaps')
                        .setDescription(`${mentionedUser ? targetUser.username : 'You'} don't have permission to access any roadmap in this server.`)
                        .setTimestamp();
                    return message.reply({ embeds: [errorEmbed] });
                }

                if (userRoadmaps.length === 1) {
                    targetRoadmap = userRoadmaps[0].roadmap;
                    roadmapKey = userRoadmaps[0].key;
                } else {
                    // Show progress for all accessible roadmaps
                    const progressEmbed = new EmbedBuilder()
                        .setColor(COLORS.BLURPLE)
                        .setTitle(`📊 ${mentionedUser ? `${targetUser.username}'s` : 'Your'} Progress Overview`)
                        .setDescription(`Here's ${mentionedUser ? `${targetUser.username}'s` : 'your'} completion progress across all accessible roadmaps:`)
                        .setTimestamp()
                        .setFooter({
                            text: `${message.guild.name} | Use progress roadmap_name for details`,
                            iconURL: message.guild.iconURL({ dynamic: true })
                        });

                    for (const { roadmap } of userRoadmaps) {
                        const tasks = roadmap.tasks || [];
                        const totalTasks = tasks.length;
                        const completedTasks = tasks.filter(task => 
                            task.completedBy && task.completedBy.includes(userId)
                        ).length;
                        
                        const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
                        const progressBar = createProgressBar(percentage);
                        
                        progressEmbed.addFields({
                            name: `🛣️ ${roadmap.name}`,
                            value: `${progressBar} ${percentage}%\n**${completedTasks}/${totalTasks}** tasks completed`,
                            inline: false
                        });
                    }

                    return message.reply({ embeds: [progressEmbed] });
                }
            }

            // Check if target user has required role
            const targetMember = mentionedUser ? message.guild.members.cache.get(mentionedUser.id) : member;
            if (!targetMember || !targetMember.roles.cache.has(targetRoadmap.roleId)) {
                const role = message.guild.roles.cache.get(targetRoadmap.roleId);
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ Access Denied')
                    .setDescription(`${mentionedUser ? targetUser.username : 'You'} need${mentionedUser ? 's' : ''} the ${role ? role.toString() : 'required'} role to view progress in this roadmap.`)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            const tasks = targetRoadmap.tasks || [];
            
            if (tasks.length === 0) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.YELLOW)
                    .setTitle('📋 No Tasks')
                    .setDescription(`No tasks found in "${targetRoadmap.name}" roadmap.`)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Calculate progress
            const totalTasks = tasks.length;
            const completedTasks = tasks.filter(task => 
                task.completedBy && task.completedBy.includes(userId)
            ).length;
            
            const percentage = Math.round((completedTasks / totalTasks) * 100);
            const progressBar = createProgressBar(percentage);

            // Group tasks by week for detailed breakdown
            const tasksByWeek = {};
            tasks.forEach(task => {
                const week = task.weekNumber || 1;
                if (!tasksByWeek[week]) {
                    tasksByWeek[week] = { total: 0, completed: 0 };
                }
                tasksByWeek[week].total++;
                if (task.completedBy && task.completedBy.includes(userId)) {
                    tasksByWeek[week].completed++;
                }
            });

            const progressEmbed = new EmbedBuilder()
                .setColor(getProgressColor(percentage))
                .setTitle(`📊 Progress: ${targetRoadmap.name}`)
                .setDescription(`${progressBar} **${percentage}%** Complete\n\n**${completedTasks}** out of **${totalTasks}** tasks completed`)
                .setTimestamp()
                .setFooter({
                    text: `Progress for ${targetUser.tag}`,
                    iconURL: targetUser.displayAvatarURL({ dynamic: true })
                });

            // Add weekly breakdown
            const weekNumbers = Object.keys(tasksByWeek).sort((a, b) => parseInt(a) - parseInt(b));
            if (weekNumbers.length > 1) {
                let weeklyBreakdown = '';
                weekNumbers.forEach(week => {
                    const weekData = tasksByWeek[week];
                    const weekPercentage = Math.round((weekData.completed / weekData.total) * 100);
                    const weekBar = createProgressBar(weekPercentage, 8); // Smaller bars for weeks
                    weeklyBreakdown += `**Week ${week}:** ${weekBar} ${weekPercentage}% (${weekData.completed}/${weekData.total})\n`;
                });

                progressEmbed.addFields({
                    name: '📅 Weekly Breakdown',
                    value: weeklyBreakdown.trim(),
                    inline: false
                });
            }

            // Add motivational message based on progress
            let motivationMessage = '';
            if (percentage === 100) {
                motivationMessage = '🎉 Congratulations! You\'ve completed all tasks!';
            } else if (percentage >= 75) {
                motivationMessage = '🚀 Great job! You\'re almost there!';
            } else if (percentage >= 50) {
                motivationMessage = '💪 Keep it up! You\'re halfway through!';
            } else if (percentage >= 25) {
                motivationMessage = '📈 Good start! Keep pushing forward!';
            } else {
                motivationMessage = '🎯 Time to get started! Every task counts!';
            }

            progressEmbed.addFields({
                name: '💡 Motivation',
                value: motivationMessage,
                inline: false
            });

            await message.reply({ embeds: [progressEmbed] });

        } catch (err) {
            console.error('Error in progress command:', err);
        }
    }
};

// Helper function to create progress bar
function createProgressBar(percentage, length = 15) {
    const filledLength = Math.round((percentage / 100) * length);
    const emptyLength = length - filledLength;
    
    const filledBar = '█'.repeat(filledLength);
    const emptyBar = '░'.repeat(emptyLength);
    
    return `${filledBar}${emptyBar}`;
}

// Helper function to get color based on progress
function getProgressColor(percentage) {
    if (percentage >= 100) return '#57F287';
    if (percentage >= 75) return '#5865F2';
    if (percentage >= 50) return '#FEE75C';
    if (percentage >= 25) return '#FF8C00';
    return '#ED4245';
}