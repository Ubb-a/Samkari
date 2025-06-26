const { EmbedBuilder } = require('discord.js');
const { COLORS } = require('../utils/embedBuilder');
const { getRoadmaps } = require('../utils/dataManager');

module.exports = {
    name: 'leaderboard',
    description: 'Show server leaderboard based on task completion',
    usage: 'leaderboard [roadmap_name]',
    
    async execute(message, args) {
        try {
            const guildId = message.guild.id;
            const allRoadmaps = getRoadmaps();
            let targetRoadmaps = [];

            // If roadmap name is provided, filter to that roadmap
            if (args.length > 0) {
                const roadmapName = args.join(' ');
                const roadmapKey = `${guildId}_${roadmapName.toLowerCase()}`;
                const roadmap = allRoadmaps[roadmapKey];

                if (!roadmap) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor('#ED4245')
                        .setTitle('❌ Roadmap Not Found')
                        .setDescription(`No roadmap named "${roadmapName}" exists in this server.`)
                        .setTimestamp();
                    return message.reply({ embeds: [errorEmbed] });
                }

                targetRoadmaps = [{ key: roadmapKey, roadmap }];
            } else {
                // Get all roadmaps for this guild
                for (const [key, roadmap] of Object.entries(allRoadmaps)) {
                    if (key.startsWith(`${guildId}_`)) {
                        targetRoadmaps.push({ key, roadmap });
                    }
                }
            }

            if (targetRoadmaps.length === 0) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#FEE75C')
                    .setTitle('📋 No Roadmaps')
                    .setDescription('No roadmaps found in this server.')
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Calculate user stats across all target roadmaps
            const userStats = new Map();

            for (const { roadmap } of targetRoadmaps) {
                const tasks = roadmap.tasks || [];
                
                // Get all users who have completed tasks
                tasks.forEach(task => {
                    if (task.completedBy && task.completedBy.length > 0) {
                        task.completedBy.forEach(userId => {
                            if (!userStats.has(userId)) {
                                userStats.set(userId, {
                                    userId,
                                    totalCompleted: 0,
                                    roadmapsActive: new Set(),
                                    completionRate: 0,
                                    totalTasks: 0
                                });
                            }
                            
                            const stats = userStats.get(userId);
                            stats.totalCompleted++;
                            stats.roadmapsActive.add(roadmap.name);
                        });
                    }
                });

                // Calculate total tasks for each user based on their role access
                const role = message.guild.roles.cache.get(roadmap.roleId);
                if (role) {
                    const usersWithRole = message.guild.members.cache.filter(member => 
                        member.roles.cache.has(roadmap.roleId) && !member.user.bot
                    );

                    usersWithRole.forEach(member => {
                        const userId = member.user.id;
                        if (!userStats.has(userId)) {
                            userStats.set(userId, {
                                userId,
                                totalCompleted: 0,
                                roadmapsActive: new Set(),
                                completionRate: 0,
                                totalTasks: 0
                            });
                        }
                        
                        const stats = userStats.get(userId);
                        stats.totalTasks += tasks.length;
                        if (stats.totalCompleted > 0) {
                            stats.roadmapsActive.add(roadmap.name);
                        }
                    });
                }
            }

            // Calculate completion rates
            userStats.forEach(stats => {
                if (stats.totalTasks > 0) {
                    stats.completionRate = Math.round((stats.totalCompleted / stats.totalTasks) * 100);
                }
            });

            // Sort users by total completed tasks (descending)
            const sortedUsers = Array.from(userStats.values())
                .filter(stats => stats.totalCompleted > 0)
                .sort((a, b) => {
                    // Primary sort: total completed tasks
                    if (b.totalCompleted !== a.totalCompleted) {
                        return b.totalCompleted - a.totalCompleted;
                    }
                    // Secondary sort: completion rate
                    return b.completionRate - a.completionRate;
                });

            if (sortedUsers.length === 0) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#FEE75C')
                    .setTitle('📊 No Activity')
                    .setDescription('No completed tasks found in the selected roadmap(s).')
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Create leaderboard embed
            const leaderboardEmbed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('🏆 Leaderboard')
                .setDescription(args.length > 0 
                    ? `Top performers in **${args.join(' ')}** roadmap`
                    : 'Top performers across all roadmaps'
                )
                .setTimestamp()
                .setFooter({
                    text: `${message.guild.name} | Based on completed tasks`,
                    iconURL: message.guild.iconURL({ dynamic: true })
                });

            // Add top performers (limit to top 10)
            const topUsers = sortedUsers.slice(0, 10);
            
            for (let i = 0; i < topUsers.length; i++) {
                const stats = topUsers[i];
                const user = message.guild.members.cache.get(stats.userId);
                
                if (user) {
                    const position = i + 1;
                    const medal = getMedal(position);
                    const roadmapsList = Array.from(stats.roadmapsActive).join(', ');
                    
                    leaderboardEmbed.addFields({
                        name: `${medal} ${position}. ${user.displayName}`,
                        value: `**${stats.totalCompleted}** tasks completed (${stats.completionRate}%)\n*Active in: ${roadmapsList}*`,
                        inline: false
                    });
                }
            }

            // Add summary statistics
            const totalUsers = sortedUsers.length;
            const totalTasksCompleted = sortedUsers.reduce((sum, stats) => sum + stats.totalCompleted, 0);
            const averageCompletion = totalUsers > 0 ? Math.round(totalTasksCompleted / totalUsers) : 0;

            leaderboardEmbed.addFields({
                name: '📈 Server Summary',
                value: `**Active Users:** ${totalUsers}\n**Total Tasks Completed:** ${totalTasksCompleted}\n**Average per User:** ${averageCompletion} tasks`,
                inline: false
            });

            await message.reply({ embeds: [leaderboardEmbed] });

        } catch (err) {
            console.error('Error in leaderboard command:', err);
        }
    }
};

function getMedal(position) {
    switch (position) {
        case 1: return '🥇';
        case 2: return '🥈';
        case 3: return '🥉';
        case 4: return '🏅';
        case 5: return '🏅';
        default: return '▫️';
    }
}