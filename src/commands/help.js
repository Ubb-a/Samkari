const { EmbedBuilder } = require('discord.js');
const { COLORS } = require('../utils/embedBuilder');

module.exports = {
    name: 'help',
    description: 'Show detailed help information',
    usage: 'help',
    
    async execute(message, args) {
        try {
            const helpEmbed = new EmbedBuilder()
            .setColor(COLORS.BLURPLE)
            .setTitle('🤖 Samkari - Help Guide')
            .setDescription('Welcome! I am a roadmap management bot. I can help you create and manage educational roadmaps customized for server members.')
            .addFields(
                {
                    name: '🗺️ create <roadmap_name> <@role>',
                    value: 'Create new roadmap linked to specific role\n**Example:** `create web-dev @Developer`',
                    inline: false
                },
                {
                    name: '📋 myroadmaps',
                    value: 'View all your available roadmaps',
                    inline: false
                },
                {
                    name: '🔍 showroadmap [roadmap_name]',
                    value: 'View roadmap based on your role (if you have multiple, specify name)\n**Example:** `showroadmap` or `showroadmap web-dev`',
                    inline: false
                },
                {
                    name: '❓ help',
                    value: 'View command list and help',
                    inline: false
                },
                {
                    name: '📊 poll <question> | <option1> | <option2>',
                    value: 'Create poll with multiple options (admin only)\n**Example:** `poll What\'s the best language? | JavaScript | Python | Java`',
                    inline: false
                },
                {
                    name: '🗳️ vote <question>',
                    value: 'Create simple yes/no vote (admin only)\n**Example:** `vote Should we change server color?`',
                    inline: false
                },
                {
                    name: '📅 schedule <roadmap> | <task> | <description> | <day>',
                    value: 'Schedule weekly tasks (admin only)\n**Example:** `schedule web-dev | Review | Weekly review | monday`',
                    inline: false
                },
                {
                    name: '➕ addtask <roadmap> <week> <task> [link: <url>]',
                    value: 'Add new task with optional link (mention or admin)\n**Example:** `addtask web-dev 2 Learn HTML link: https://example.com`',
                    inline: false
                },
                {
                    name: '🗑️ deletetask <roadmap> <task_number>',
                    value: 'Delete specific task and reorder IDs (mention or admin)\n**Example:** `deletetask web-dev 3`',
                    inline: false
                },
                {
                    name: '📦 bulkaddtask <roadmap> <week> , <task1> , <task2>',
                    value: 'Add multiple tasks to specific week\n**Example:** `bulkaddtask web-dev 1 , HTML , CSS , JavaScript`',
                    inline: false
                },
                {
                    name: '📋 tasks [roadmap_name]',
                    value: 'View all tasks numbered 1 to N. If you have one roadmap, no need to specify name\n**Example:** `tasks` or `tasks backend`',
                    inline: false
                },
                {
                    name: '✅ done <task_number> [roadmap_name]',
                    value: 'Complete task by its number\n**Example:** `done 2` or `done 3 backend`',
                    inline: false
                },
                {
                    name: '↩️ undo <task_number> [roadmap_name]',
                    value: 'Undo task completion if marked by mistake\n**Example:** `undo 2` or `undo 3 backend`',
                    inline: false
                },
                {
                    name: '📊 progress [@user] [roadmap_name]',
                    value: 'View completion progress percentage (yours or mentioned user)\n**Example:** `progress` or `progress @john backend`',
                    inline: false
                },
                {
                    name: '📈 stats [@user] [roadmap_name]',
                    value: 'View detailed statistics including completion time and streaks\n**Example:** `stats` or `stats @john backend`',
                    inline: false
                },
                {
                    name: '🏆 leaderboard [roadmap_name]',
                    value: 'Show server leaderboard based on task completion\n**Example:** `leaderboard` or `leaderboard backend`',
                    inline: false
                },
                {
                    name: '📊 taskstats <roadmap_name>',
                    value: 'View task interaction statistics (admin only)\n**Shows:** Who completed which tasks',
                    inline: false
                },
                {
                    name: '🧹 clear [number]',
                    value: 'Clear chat messages (admin only)\n**Example:** `clear 10` or `clear` (clears last 5)',
                    inline: false
                },
                {
                    name: '📬 dm <@role> <message>',
                    value: 'Send private message to all users with specific role (admin only)\n**Example:** `dm @Developer Check new tasks!`',
                    inline: false
                },
                {
                    name: '🗑️ deleteroadmap <roadmap_name>',
                    value: 'Delete roadmap completely (admin only)\n**Example:** `deleteroadmap backend`',
                    inline: false
                },
                {
                    name: '🧹 emptyroadmap <roadmap_name>',
                    value: 'Empty all tasks from roadmap (admin only)\n**Example:** `emptyroadmap backend`',
                    inline: false
                },
                {
                    name: '📤 autopost <channel_id> <msg1> | <msg2> | <msg3>',
                    value: 'Setup automatic posting every minute (admin only)\n**Example:** `autopost 123456 Hello! | Good morning! | How are you?`\n**Stop:** `autopost stop`',
                    inline: false
                }
            )
            .addFields({
                name: '💡 Important Tips',
                value: '• Need "Manage Roles" permission to create new roadmaps\n• Each roadmap is linked to specific role\n• Only users with required role can access roadmap\n• Use exact roadmap names\n• Data saves automatically per server\n• Commands work without "!" prefix or with "ya samkari"',
                inline: false
            })
            .addFields({
                name: '🚀 Getting Started',
                value: '1. Use `create` to make new roadmap\n2. Use `addtask` to add tasks to roadmap\n3. Use `tasks` to view numbered tasks\n4. Use `done task_number` to complete tasks\n5. Use `undo task_number` if you marked wrong task\n6. Use `progress` to see completion percentage\n7. Use `stats` for detailed completion statistics\n8. Use `leaderboard` to see top performers\n9. Use `taskstats` to track progress (admin)',
                inline: false
            })
            .setTimestamp()
            .setFooter({
                text: 'Samkari - Built with Discord.js v14',
                iconURL: message.guild.iconURL({ dynamic: true })
            })
            .setThumbnail(message.client.user.displayAvatarURL({ dynamic: true }));

        return message.reply({ embeds: [helpEmbed] }).catch(console.error);
        } catch (err) {
            console.error('Error in help command:', err);
        }
    }
};