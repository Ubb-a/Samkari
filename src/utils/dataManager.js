const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data.json');

// Initialize data file if it doesn't exist
function initializeDataFile() {
    if (!fs.existsSync(DATA_FILE)) {
        const initialData = {
            roadmaps: {},
            lastUpdated: new Date().toISOString(),
            version: '1.0.0'
        };
        fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
        console.log('📄 Initialized data.json file');
    }
}

// Read data from JSON file
function readData() {
    try {
        initializeDataFile();
        const rawData = fs.readFileSync(DATA_FILE, 'utf8').trim();
        
        // Check if file is empty or corrupted
        if (!rawData || rawData === '' || rawData === '{}') {
            console.log('📄 Data file empty or corrupted, initializing...');
            return getDefaultData();
        }
        
        const data = JSON.parse(rawData);
        
        // Validate data structure
        if (!data.roadmaps) {
            data.roadmaps = {};
        }
        if (!data.lastUpdated) {
            data.lastUpdated = new Date().toISOString();
        }
        if (!data.version) {
            data.version = '1.0.0';
        }
        
        return data;
    } catch (error) {
        console.error('Error reading data file:', error);
        console.log('📄 Reinitializing corrupted data file...');
        
        // Create backup of corrupted file
        try {
            const corruptedData = fs.readFileSync(DATA_FILE, 'utf8');
            fs.writeFileSync(`${DATA_FILE}.backup.${Date.now()}`, corruptedData);
            console.log('📄 Backup created for corrupted file');
        } catch (backupError) {
            console.error('Failed to create backup:', backupError);
        }
        
        // Return and save default structure
        const defaultData = getDefaultData();
        writeData(defaultData);
        return defaultData;
    }
}

function getDefaultData() {
    return {
        roadmaps: {},
        lastUpdated: new Date().toISOString(),
        version: '1.0.0',
        autoposting: {}
    };
}

// Write data to JSON file with atomic operation
function writeData(data) {
    try {
        data.lastUpdated = new Date().toISOString();
        
        // Validate data structure before writing
        if (!data.roadmaps) data.roadmaps = {};
        if (!data.version) data.version = '1.0.0';
        if (!data.autoposting) data.autoposting = {};
        
        const jsonString = JSON.stringify(data, null, 2);
        
        // Write to temporary file first, then rename (atomic operation)
        const tempFile = `${DATA_FILE}.tmp`;
        fs.writeFileSync(tempFile, jsonString);
        fs.renameSync(tempFile, DATA_FILE);
        
        return true;
    } catch (error) {
        console.error('Error writing data file:', error);
        // Clean up temp file if it exists
        try {
            if (fs.existsSync(`${DATA_FILE}.tmp`)) {
                fs.unlinkSync(`${DATA_FILE}.tmp`);
            }
        } catch (cleanupError) {
            console.error('Error cleaning up temp file:', cleanupError);
        }
        return false;
    }
}

// Get all roadmaps
function getRoadmaps() {
    const data = readData();
    return data.roadmaps || {};
}

// Get a specific roadmap
function getRoadmap(roadmapId) {
    const roadmaps = getRoadmaps();
    return roadmaps[roadmapId] || null;
}

// Save a roadmap
function saveRoadmap(roadmapId, roadmapData) {
    const data = readData();
    
    if (!data.roadmaps) {
        data.roadmaps = {};
    }
    
    data.roadmaps[roadmapId] = roadmapData;
    
    const success = writeData(data);
    if (!success) {
        throw new Error('Failed to save roadmap data');
    }
    
    console.log(`💾 Saved roadmap: ${roadmapData.name} (${roadmapId})`);
    return true;
}

// Delete a roadmap
function deleteRoadmap(roadmapId) {
    const data = readData();
    
    if (data.roadmaps && data.roadmaps[roadmapId]) {
        const roadmapName = data.roadmaps[roadmapId].name;
        delete data.roadmaps[roadmapId];
        
        const success = writeData(data);
        if (!success) {
            throw new Error('Failed to delete roadmap data');
        }
        
        console.log(`🗑️ Deleted roadmap: ${roadmapName} (${roadmapId})`);
        return true;
    }
    
    return false;
}

// Update a task in a roadmap
function updateTask(roadmapId, taskId, taskData) {
    const data = readData();
    
    if (!data.roadmaps || !data.roadmaps[roadmapId]) {
        throw new Error('Roadmap not found');
    }
    
    const roadmap = data.roadmaps[roadmapId];
    if (!roadmap.tasks) {
        roadmap.tasks = [];
    }
    
    const taskIndex = roadmap.tasks.findIndex(task => task.id === taskId);
    
    if (taskIndex === -1) {
        // Add new task
        taskData.id = taskId;
        taskData.createdAt = new Date().toISOString();
        roadmap.tasks.push(taskData);
    } else {
        // Update existing task
        roadmap.tasks[taskIndex] = { ...roadmap.tasks[taskIndex], ...taskData };
        roadmap.tasks[taskIndex].updatedAt = new Date().toISOString();
    }
    
    const success = writeData(data);
    if (!success) {
        throw new Error('Failed to update task data');
    }
    
    console.log(`📝 Updated task ${taskId} in roadmap: ${roadmap.name}`);
    return true;
}

// Get roadmap statistics
function getRoadmapStats() {
    const roadmaps = getRoadmaps();
    const stats = {
        totalRoadmaps: 0,
        totalTasks: 0,
        completedTasks: 0,
        guilds: new Set()
    };
    
    Object.values(roadmaps).forEach(roadmap => {
        stats.totalRoadmaps++;
        stats.guilds.add(roadmap.guildId);
        
        if (roadmap.tasks) {
            stats.totalTasks += roadmap.tasks.length;
            stats.completedTasks += roadmap.tasks.filter(task => task.status === 'completed').length;
        }
    });
    
    stats.guilds = stats.guilds.size;
    return stats;
}

// Backup data
function createBackup() {
    try {
        const data = readData();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(__dirname, '..', `data-backup-${timestamp}.json`);
        
        fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
        console.log(`💾 Created backup: ${backupPath}`);
        return backupPath;
    } catch (error) {
        console.error('Error creating backup:', error);
        throw error;
    }
}

module.exports = {
    getRoadmaps,
    getRoadmap,
    saveRoadmap,
    deleteRoadmap,
    updateTask,
    getRoadmapStats,
    createBackup,
    readData,
    writeData
};
