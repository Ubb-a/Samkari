const express = require('express');
const path = require('path');

// Create Express app for keep-alive server
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware for parsing JSON and serving static files
app.use(express.json());
app.use(express.static('public'));

// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        service: 'Discord Roadmap Bot',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0'
    });
});

// Bot status endpoint
app.get('/status', (req, res) => {
    try {
        const client = require('./bot');
        const { getRoadmapStats } = require('./src/utils/dataManager');
        
        const stats = getRoadmapStats();
        
        res.json({
            bot: {
                online: client.isReady(),
                username: client.user ? client.user.tag : 'Not logged in',
                guilds: client.guilds ? client.guilds.cache.size : 0,
                uptime: client.uptime || 0
            },
            data: stats,
            server: {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error getting bot status:', error);
        res.status(500).json({
            error: 'Unable to retrieve bot status',
            timestamp: new Date().toISOString()
        });
    }
});

// API endpoint to get roadmap data (for external integrations)
app.get('/api/roadmaps', (req, res) => {
    try {
        const { getRoadmaps } = require('./src/utils/dataManager');
        const roadmaps = getRoadmaps();
        
        res.json({
            success: true,
            count: Object.keys(roadmaps).length,
            roadmaps: roadmaps,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error fetching roadmaps:', error);
        res.status(500).json({
            success: false,
            error: 'Unable to fetch roadmaps',
            timestamp: new Date().toISOString()
        });
    }
});

// API endpoint to get specific roadmap
app.get('/api/roadmaps/:id', (req, res) => {
    try {
        const { getRoadmap } = require('./src/utils/dataManager');
        const roadmap = getRoadmap(req.params.id);
        
        if (!roadmap) {
            return res.status(404).json({
                success: false,
                error: 'Roadmap not found',
                timestamp: new Date().toISOString()
            });
        }
        
        res.json({
            success: true,
            roadmap: roadmap,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error fetching roadmap:', error);
        res.status(500).json({
            success: false,
            error: 'Unable to fetch roadmap',
            timestamp: new Date().toISOString()
        });
    }
});

// Backup endpoint (GET request to create backup)
app.get('/api/backup', (req, res) => {
    try {
        const { createBackup } = require('./src/utils/dataManager');
        const backupPath = createBackup();
        
        res.json({
            success: true,
            message: 'Backup created successfully',
            backupPath: path.basename(backupPath),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error creating backup:', error);
        res.status(500).json({
            success: false,
            error: 'Unable to create backup',
            timestamp: new Date().toISOString()
        });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        availableEndpoints: [
            'GET /',
            'GET /status',
            'GET /api/roadmaps',
            'GET /api/roadmaps/:id',
            'GET /api/backup'
        ],
        timestamp: new Date().toISOString()
    });
});

// Error handler
app.use((error, req, res, next) => {
    console.error('Express error:', error);
    res.status(500).json({
        error: 'Internal server error',
        timestamp: new Date().toISOString()
    });
});

// Start the keep-alive server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Keep-alive server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}`);
    console.log(`🤖 Bot status: http://localhost:${PORT}/status`);
    
    // Start the Discord bot
    require('./bot');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});

module.exports = app;
