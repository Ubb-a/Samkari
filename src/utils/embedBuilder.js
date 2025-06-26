const { EmbedBuilder } = require('discord.js');

// Discord color constants
const COLORS = {
    BLURPLE: '#5865F2',
    GREEN: '#57F287',
    RED: '#ED4245',
    YELLOW: '#FEE75C',
    ORANGE: '#FF8C00',
    DARK: '#2F3136',
    WHITE: '#FFFFFF'
};

/**
 * Create a success embed with Discord green color
 * @param {string} title - The embed title
 * @param {string} description - The embed description
 * @returns {EmbedBuilder} - The success embed
 */
function createSuccessEmbed(title, description) {
    return new EmbedBuilder()
        .setColor(COLORS.GREEN)
        .setTitle(`✅ ${title}`)
        .setDescription(description)
        .setTimestamp();
}

/**
 * Create an error embed with Discord red color
 * @param {string} title - The embed title
 * @param {string} description - The embed description
 * @returns {EmbedBuilder} - The error embed
 */
function createErrorEmbed(title, description) {
    return new EmbedBuilder()
        .setColor(COLORS.RED)
        .setTitle(`❌ ${title}`)
        .setDescription(description)
        .setTimestamp();
}

/**
 * Create an info embed with Discord blurple color
 * @param {string} title - The embed title
 * @param {string} description - The embed description
 * @returns {EmbedBuilder} - The info embed
 */
function createInfoEmbed(title, description) {
    return new EmbedBuilder()
        .setColor(COLORS.BLURPLE)
        .setTitle(`ℹ️ ${title}`)
        .setDescription(description)
        .setTimestamp();
}

/**
 * Create a warning embed with Discord yellow color
 * @param {string} title - The embed title
 * @param {string} description - The embed description
 * @returns {EmbedBuilder} - The warning embed
 */
function createWarningEmbed(title, description) {
    return new EmbedBuilder()
        .setColor(COLORS.YELLOW)
        .setTitle(`⚠️ ${title}`)
        .setDescription(description)
        .setTimestamp();
}

/**
 * Create a roadmap embed with custom styling
 * @param {Object} roadmap - The roadmap object
 * @param {Object} guild - The Discord guild object
 * @returns {EmbedBuilder} - The roadmap embed
 */
function createRoadmapEmbed(roadmap, guild) {
    const tasks = roadmap.tasks || [];
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    // Create progress bar
    const progressBarLength = 15;
    const filledLength = Math.round((progressPercentage / 100) * progressBarLength);
    const emptyLength = progressBarLength - filledLength;
    const progressBar = '█'.repeat(filledLength) + '░'.repeat(emptyLength);
    
    const embed = new EmbedBuilder()
        .setColor(COLORS.BLURPLE)
        .setTitle(`🗺️ ${roadmap.name}`)
        .setDescription(`**Progress:** ${progressPercentage}% (${completedTasks}/${totalTasks} tasks)\n\`${progressBar}\``)
        .addFields(
            {
                name: '📊 Statistics',
                value: `✅ Completed: ${completedTasks}\n⏳ Pending: ${totalTasks - completedTasks}\n📅 Created: ${new Date(roadmap.createdAt).toLocaleDateString()}`,
                inline: true
            }
        )
        .setTimestamp()
        .setFooter({
            text: guild ? guild.name : 'Discord Bot',
            iconURL: guild ? guild.iconURL({ dynamic: true }) : null
        });
    
    return embed;
}

/**
 * Create a task embed
 * @param {Object} task - The task object
 * @param {number} index - The task index
 * @returns {EmbedBuilder} - The task embed
 */
function createTaskEmbed(task, index = null) {
    let statusColor = COLORS.YELLOW;
    let statusEmoji = '⏳';
    
    switch (task.status) {
        case 'completed':
            statusColor = COLORS.GREEN;
            statusEmoji = '✅';
            break;
        case 'in-progress':
            statusColor = COLORS.BLURPLE;
            statusEmoji = '🔄';
            break;
        default:
            statusColor = COLORS.YELLOW;
            statusEmoji = '⏳';
    }
    
    const title = index !== null ? `${statusEmoji} Task ${index + 1}: ${task.title}` : `${statusEmoji} ${task.title}`;
    
    const embed = new EmbedBuilder()
        .setColor(statusColor)
        .setTitle(title)
        .setDescription(task.description || 'No description provided.')
        .addFields(
            {
                name: '📋 Status',
                value: task.status.charAt(0).toUpperCase() + task.status.slice(1).replace('-', ' '),
                inline: true
            },
            {
                name: '📅 Created',
                value: new Date(task.createdAt).toLocaleDateString(),
                inline: true
            }
        )
        .setTimestamp();
    
    if (task.updatedAt) {
        embed.addFields({
            name: '🔄 Last Updated',
            value: new Date(task.updatedAt).toLocaleDateString(),
            inline: true
        });
    }
    
    return embed;
}

/**
 * Create a help embed
 * @param {string} prefix - The bot command prefix
 * @returns {EmbedBuilder} - The help embed
 */
function createHelpEmbed(prefix = '!') {
    return new EmbedBuilder()
        .setColor(COLORS.BLURPLE)
        .setTitle('🤖 Roadmap Bot Help')
        .setDescription('Manage role-based roadmaps with task tracking!')
        .addFields(
            {
                name: `📝 ${prefix}create <name> role:@<role>`,
                value: 'Create a new roadmap with role-based permissions',
                inline: false
            },
            {
                name: `📋 ${prefix}myroadmaps`,
                value: 'List all roadmaps you have access to',
                inline: false
            },
            {
                name: `🗺️ ${prefix}showroadmap <name>`,
                value: 'Display detailed information about a roadmap',
                inline: false
            }
        )
        .addFields({
            name: '💡 Tips',
            value: '• You need "Manage Roles" permission to create roadmaps\n• Only users with the required role can access each roadmap\n• Use exact roadmap names (case-insensitive)',
            inline: false
        })
        .setTimestamp()
        .setFooter({
            text: 'Made with ❤️ using Discord.js v14'
        });
}

module.exports = {
    createSuccessEmbed,
    createErrorEmbed,
    createInfoEmbed,
    createWarningEmbed,
    createRoadmapEmbed,
    createTaskEmbed,
    createHelpEmbed,
    COLORS
};
