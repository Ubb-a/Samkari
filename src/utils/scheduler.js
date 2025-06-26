const { readData, writeData, getRoadmap, saveRoadmap } = require('./dataManager');

class TaskScheduler {
    constructor(client) {
        this.client = client;
        this.isRunning = false;
        this.checkInterval = 60000; // Check every minute
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        console.log('📅 Task scheduler started');
        
        // Check immediately
        this.checkScheduledTasks();
        
        // Then check every minute
        this.intervalId = setInterval(() => {
            this.checkScheduledTasks();
        }, this.checkInterval);
    }

    stop() {
        if (!this.isRunning) return;
        this.isRunning = false;
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        console.log('📅 Task scheduler stopped');
    }

    checkScheduledTasks() {
        try {
            const data = readData();
            const scheduledTasks = data.scheduledTasks || {};
            const now = new Date();
            
            // Get current day of week (0 = Sunday, 1 = Monday, etc.)
            const currentDay = now.getDay();
            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const todayName = dayNames[currentDay];
            
            // Check if it's time to add tasks (only at 9 AM on scheduled days)
            const currentHour = now.getHours();
            if (currentHour !== 9) return; // Only run at 9 AM
            
            // Check if we already ran today
            const todayKey = now.toISOString().split('T')[0]; // YYYY-MM-DD
            if (data.lastSchedulerRun === todayKey) return;
            
            // Mark as run for today
            data.lastSchedulerRun = todayKey;
            writeData(data);
            
            // Find tasks for today
            const tasksForToday = Object.values(scheduledTasks).filter(task => 
                task.isActive && task.dayOfWeek === todayName
            );
            
            if (tasksForToday.length === 0) return;
            
            console.log(`📅 Found ${tasksForToday.length} scheduled tasks for ${todayName}`);
            
            // Add tasks to their respective roadmaps
            tasksForToday.forEach(scheduledTask => {
                this.addScheduledTaskToRoadmap(scheduledTask);
            });
            
        } catch (error) {
            console.error('Error checking scheduled tasks:', error);
        }
    }

    addScheduledTaskToRoadmap(scheduledTask) {
        try {
            const roadmap = getRoadmap(scheduledTask.roadmapKey);
            if (!roadmap) {
                console.log(`❌ Roadmap not found for scheduled task: ${scheduledTask.roadmapKey}`);
                return;
            }

            // Check if task already exists for this week
            const now = new Date();
            const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
            const weekKey = weekStart.toISOString().split('T')[0];
            
            const existingTask = roadmap.tasks.find(task => 
                task.title === scheduledTask.taskTitle && 
                task.weekAdded === weekKey
            );
            
            if (existingTask) {
                console.log(`📅 Task already exists for this week: ${scheduledTask.taskTitle}`);
                return;
            }

            // Add new task
            const newTaskId = roadmap.tasks.length > 0 ? Math.max(...roadmap.tasks.map(t => t.id)) + 1 : 1;
            const newTask = {
                id: newTaskId,
                title: scheduledTask.taskTitle,
                description: scheduledTask.taskDescription,
                status: 'pending',
                createdAt: new Date().toISOString(),
                weekAdded: weekKey,
                isScheduled: true,
                scheduledTaskId: scheduledTask.id,
                completedBy: [],
                hiddenBy: []
            };

            roadmap.tasks.push(newTask);
            saveRoadmap(scheduledTask.roadmapKey, roadmap);

            console.log(`✅ Added scheduled task "${scheduledTask.taskTitle}" to roadmap "${scheduledTask.roadmapName}"`);

            // Try to notify the guild (if bot has access)
            this.notifyGuild(scheduledTask, newTask);

        } catch (error) {
            console.error('Error adding scheduled task to roadmap:', error);
        }
    }

    async notifyGuild(scheduledTask, newTask) {
        try {
            const guild = this.client.guilds.cache.get(scheduledTask.guildId);
            if (!guild) return;

            // Find a general channel to send notification
            const channels = guild.channels.cache.filter(channel => 
                channel.type === 0 && // Text channel
                channel.permissionsFor(guild.members.me).has(['SendMessages', 'ViewChannel'])
            );

            const generalChannel = channels.find(ch => 
                ch.name.includes('general') || 
                ch.name.includes('chat') || 
                ch.name.includes('main')
            ) || channels.first();

            if (!generalChannel) return;

            const { EmbedBuilder } = require('discord.js');
            const { COLORS } = require('./embedBuilder');

            const embed = new EmbedBuilder()
                .setColor(COLORS.BLURPLE)
                .setTitle('📅 مهمة جديدة مجدولة')
                .setDescription(`تم إضافة مهمة جديدة للرود ماب **${scheduledTask.roadmapName}**`)
                .addFields(
                    { name: '📝 المهمة', value: newTask.title, inline: false },
                    { name: '📄 الوصف', value: newTask.description, inline: false }
                )
                .setTimestamp()
                .setFooter({ text: 'مهمة مجدولة أسبوعياً' });

            await generalChannel.send({ embeds: [embed] });

        } catch (error) {
            console.error('Error notifying guild about scheduled task:', error);
        }
    }
}

module.exports = TaskScheduler;