const { EmbedBuilder } = require('discord.js');
const { COLORS } = require('../utils/embedBuilder');
const { getRoadmap, saveRoadmap, getRoadmaps } = require('../utils/dataManager');

module.exports = {
    name: 'done',
    description: 'Mark a task as completed by its ID',
    usage: 'done <task_id> [roadmap_name]',
    
    async execute(message, args) {
        try {
            if (args.length === 0) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ Task Number Missing')
                    .setDescription(`**Usage:** ${this.usage}\n**Example:** \`done 2\` or \`done 2 backend\``)
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
                        .setDescription(`You have access to multiple roadmaps: ${roadmapNames}\n\nPlease specify the roadmap name:\n\`done ${taskId} roadmap_name\``)
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
            
            // Filter visible tasks for this user
            const visibleTasks = tasks.filter(task => 
                !task.hiddenBy || !task.hiddenBy.includes(userId)
            );

            if (visibleTasks.length === 0) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.YELLOW)
                    .setTitle('📋 No Tasks')
                    .setDescription(`No visible tasks in "${targetRoadmap.name}" roadmap.`)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            if (taskId > visibleTasks.length) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ Task ID Not Found')
                    .setDescription(`Task ID ${taskId} doesn't exist. Available tasks: ${visibleTasks.length}`)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Find the task by ID
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

            let taskHiddenForAll = false;
            
            if (!isCompleted) {
                task.completedBy.push(userId);
                
                // Check if all users with the role have completed this task
                const role = message.guild.roles.cache.get(targetRoadmap.roleId);
                if (role) {
                    const usersWithRole = message.guild.members.cache.filter(member => 
                        member.roles.cache.has(targetRoadmap.roleId) && !member.user.bot
                    );
                    
                    const allCompleted = usersWithRole.every(member => 
                        task.completedBy.includes(member.user.id)
                    );
                    
                    if (allCompleted && usersWithRole.size > 0) {
                        // Hide task for all users
                        if (!task.hiddenBy) task.hiddenBy = [];
                        usersWithRole.forEach(member => {
                            if (!task.hiddenBy.includes(member.user.id)) {
                                task.hiddenBy.push(member.user.id);
                            }
                        });
                        taskHiddenForAll = true;
                    }
                }
                
                saveRoadmap(roadmapKey, targetRoadmap);
            }

            const successEmbed = new EmbedBuilder()
                .setColor(COLORS.GREEN)
                .setTitle('✅ Task Completed!')
                .setDescription(`**Task:** ${task.title}\n**Topic:** ${task.topic || 'General'}\n**Roadmap:** ${targetRoadmap.name}${taskHiddenForAll ? '\n\n🎉 **All team members completed this task! Task hidden from list.**' : ''}`)
                .addFields([
                    {
                        name: '🎯 Details',
                        value: `**Task ID:** ${taskId}\n**Status:** ${isCompleted ? 'Already completed' : 'Newly completed'}\n**Week:** ${task.weekNumber || 'Not specified'}`,
                        inline: false
                    }
                ])
                .setTimestamp()
                .setFooter({
                    text: `${isCompleted ? 'Already completed' : 'Completed'} by ${message.author.tag}`,
                    iconURL: message.author.displayAvatarURL({ dynamic: true })
                });

            await message.reply({ embeds: [successEmbed] });

        } catch (err) {
            console.error('Error in done command:', err);
        }
    }
};