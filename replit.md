# Discord Roadmap Bot

## Overview

This is a Discord bot application designed to manage role-based roadmaps within Discord servers. The bot allows users with appropriate permissions to create and manage learning/development roadmaps that are accessible only to users with specific roles. Built with Node.js, Discord.js v14, and Express for keep-alive functionality.

## System Architecture

### Backend Architecture
- **Node.js Runtime**: Core JavaScript runtime environment
- **Discord.js v14**: Primary Discord API wrapper for bot functionality
- **Express Server**: HTTP server for health checks and status monitoring
- **File-based Storage**: JSON file system for data persistence

### Command System
- **Modular Command Structure**: Commands are organized in separate files within a `/commands` directory
- **Permission-based Access**: Role-based permission system for roadmap management
- **Collection-based Command Loading**: Dynamic command loading using Discord.js Collections

### Data Management
- **JSON File Storage**: Simple file-based data persistence using `data.json`
- **Utility Layer**: Centralized data management through `utils/dataManager.js`
- **Roadmap Structure**: Guild-scoped roadmaps with role-based access control

## Key Components

### Bot Core (`bot.js`)
- Discord client initialization with necessary gateway intents
- Command collection and dynamic loading system
- Message event handling for command processing
- Bot presence and activity management

### Web Server (`server.js`)
- Express HTTP server for external monitoring
- Health check endpoints (`/` and `/status`)
- Bot status reporting with guild and data statistics
- Keep-alive functionality for hosting platforms

### Data Management (`utils/dataManager.js`)
- JSON file-based storage operations
- Roadmap CRUD operations
- Data integrity and error handling
- Statistics and analytics functions

### Embed Builder (`utils/embedBuilder.js`)
- Standardized Discord embed creation
- Consistent color scheme using Discord brand colors
- Success, error, and info embed templates
- Reusable embed components for consistent UI

### Commands
- **create**: Role-restricted roadmap creation with permission validation
- **myroadmaps**: User-specific roadmap listing based on role access
- **showroadmap**: Detailed roadmap display with access control

## Data Flow

1. **Command Processing**: Messages with `!` prefix are parsed and routed to appropriate command handlers
2. **Permission Validation**: Role-based access control checks before executing sensitive operations
3. **Data Operations**: JSON file read/write operations through the data manager utility
4. **Response Generation**: Embed-based responses with consistent formatting and error handling
5. **Guild Scoping**: All roadmaps are scoped to specific Discord guilds for multi-server support

## External Dependencies

### Core Dependencies
- **discord.js**: Discord API wrapper for bot functionality
- **express**: Web server framework for monitoring endpoints
- **dotenv**: Environment variable management for sensitive configuration

### System Dependencies
- **Node.js 20**: Runtime environment specified in Replit configuration
- **File System**: Native fs module for JSON data persistence

## Deployment Strategy

### Replit Configuration
- **Module**: nodejs-20 for modern Node.js runtime
- **Workflow**: Parallel execution of Discord bot and web server
- **Auto-install**: Automatic dependency installation via npm
- **Port Configuration**: Express server on configurable port (default 3000)

### Environment Setup
- **Environment Variables**: Bot token and configuration through `.env` file
- **Automatic Initialization**: Data file creation on first run
- **Health Monitoring**: HTTP endpoints for external monitoring and keep-alive

### Hosting Considerations
- **Keep-alive Server**: Express server prevents bot from sleeping on free hosting
- **Memory Management**: In-memory command collection with file-based data persistence
- **Error Handling**: Graceful error handling for network and file system operations

## Recent Changes

- **June 26, 2025**: Project migration to Replit environment completed
  - Reorganized file structure with src/ directory for better maintainability
  - Updated all import paths to use new organized structure
  - Added video title extraction feature for links in tasks
  - Links now display video/page titles instead of full URLs
  - Migrated from Replit Agent to standard Replit environment
  - Express server running on port 5000 with API endpoints
  - All commands loading successfully with organized structure
- **June 25, 2025**: Complete Discord roadmap bot implementation
  - Built role-based roadmap management system
  - Implemented command handlers (!create, !myroadmaps, !showroadmap, !help)
  - Added comprehensive Arabic help command with detailed explanations
  - All bot responses are now in Arabic
  - Fixed error handling to prevent duplicate error messages
  - Added quick command listing when user types just "!"
  - Added unknown command handling with helpful suggestions
  - Fixed duplicate reply issue in all commands with proper try-catch blocks
  - **NEW**: Added interactive task management system
    - !addtask command for adding tasks to roadmaps with unique emoji assignment
    - !tasks command for viewing tasks with custom emoji reactions
    - !taskstats command for admin tracking of user task interactions
    - Unique emoji system: Each task gets its own emoji (1️⃣, 2️⃣, 3️⃣, etc.)
    - Personal task completion tracking per user with specific task identification
    - Task hiding functionality (tasks hidden individually per user)
    - Admin dashboard showing who completed/hid which specific tasks
  - **UPDATED**: Complete system overhaul from emoji to number-based
    - Replaced complex emoji system with simple numbered tasks (1, 2, 3...)
    - Added new done command for completing tasks by number
    - Removed emoji reaction handler completely
    - Tasks now display clearly numbered for easy identification
    - Users can complete tasks with simple commands like done 2
  - **FINALIZED**: Full English conversion and command prefix removal
    - Converted all Arabic text to English throughout the entire system
    - Removed ! prefix requirement - commands work with or without !
    - Added clear command for chat management (admin only)
    - Smart role detection for automatic roadmap access
  - **NEW**: Added "يا سمكري" prefix system (June 25, 2025)
    - Changed bot description to Arabic with personality
    - Added "يا سمكري" as alternative command prefix alongside "!"
    - Users can now use "يا سمكري help" or just "يا سمكري" to see commands
    - All commands work with both prefixes: "!help" or "يا سمكري help"
  - **UPDATED**: Full Egyptian Arabic conversion (June 25, 2025)
    - Converted all Arabic text to Egyptian dialect throughout the system
    - Changed "كوماندات" to "أوامر" (commands to orders)
    - Changed "خرائط الطريق" to "رود ماب" (roadmaps)
    - Updated help command with Egyptian Arabic descriptions
    - All error messages and responses now in Egyptian Arabic
    - Removed all instances of "خريطة" and replaced with "رود ماب"
    - Added poll command for creating interactive polls with multiple options
    - Added vote command for simple yes/no voting with ✅/❌ reactions
    - **NEW**: Added weekly task scheduling system (June 25, 2025)
      - Tasks now support week numbers (1-52) for organization
      - addtask command updated to include week parameter
      - showroadmap displays tasks grouped by weeks
      - tasks command shows weekly organization
      - schedule command for managing weekly recurring tasks
  - **ENHANCED**: Added admin communication and management tools
    - Added dm command for sending private messages to all users with specific role
    - Added deleteroadmap command for permanent roadmap deletion with confirmation
    - Added bulkaddtask command for adding multiple tasks at once using | separator
    - All admin commands require "Manage Roles" permission for security
  - Added JSON data persistence with backup functionality
  - Configured Express web server for monitoring and API endpoints
  - Successfully connected Discord bot with proper intents
  - Bot is online and serving Discord servers
  - **NEW**: Added Arabic response feature for "زعزوع" mentions
    - Bot automatically detects "زعزوع" in any message (case-insensitive)
    - Only responds when ub.d user is not active in channel (no messages in last 2 minutes)
    - Responds with custom message indicating person is sleeping/tired and will reply when back
    - Automatically finds and mentions ub.d user in the server
    - Added duplicate response prevention with 10-second cooldown per channel
    - Uses message history check instead of presence data (no privileged intents required)
    - Works independently of command system
  - **UPDATED**: Major system overhaul (June 25, 2025)
    - Replaced role-based restrictions with mention-based permissions
    - Removed all commas from commands, now using spaces (except bulkaddtask)
    - Added link support with "link:" keyword for tasks
    - Simplified addtask format: roadmap_name week_number task_title [link: url]
    - Added deletetask command with automatic ID reordering
    - Enhanced showroadmap to be role-based with smart selection
    - All tasks now display links when provided
    - Implemented hierarchical task display format (Week Number -> Topic Name -> Numbered tasks with multi-line links)
    - Added support for multiple links per task
  - **FINAL**: Complete English conversion (June 25, 2025)
    - Converted all Arabic text to English throughout the entire system
    - Changed bot prefix from "يا سمكري" to "ya samkari"
    - Updated all command descriptions, error messages, and responses to English
    - Changed "za3zo3" mention detection from Arabic to English transliteration
    - All help commands and bot responses now in English
  - **ENHANCED**: Topic-based task organization (June 25, 2025)
    - Updated addtask command to require topic parameter: addtask <roadmap> <week> <topic> <task> [link: url1,url2]
    - Added multi-link support using comma separation (link:url1,url2,url3)
    - Implemented hierarchical display: Week Number → Topic Name → Tasks → Links
    - Updated showroadmap and tasks commands to display week/topic/task hierarchy
    - Tasks are now organized by topics within weeks for better structure
    - Multiple links per task are displayed individually under each task
  - **REWRITTEN**: Complete bulkaddtask command overhaul (June 25, 2025)
    - Completely rewrote parsing logic from scratch for better reliability
    - Changed main separator to pipe (`|`) for tasks and entries
    - Links within tasks use comma (`,`) separation after "link:" keyword
    - New format: `bulkaddtask roadmap week T:topic task1 link:url1,url2 | task2 | T:newtopic task3`
    - Simplified parsing: split by pipe first, then process each entry individually
    - Topics can be standalone entries or combined with tasks
    - Fixed conflict between task separator and link separator
  - **NEW**: Added emptyroadmap command for roadmap management (June 25, 2025)
    - Admin-only command to empty all tasks from a roadmap
    - Direct execution without confirmation dialog (simplified workflow)
    - Requires "Manage Roles" permission and appropriate role access
    - Shows task count after deletion and added to help command
  - **FIXED**: Tasks command Discord embed character limit error (June 25, 2025)
    - Added automatic text chunking for large task lists
    - Splits long week displays into multiple embed fields
    - Maintains readability while respecting 1024 character Discord limit
  - **NEW**: Added automatic message posting system (June 25, 2025)
    - autopost command for setting up recurring messages every minute
    - Support for multiple different messages that rotate automatically
    - Channel-specific posting with admin-only configuration
    - Built-in scheduler that persists across bot restarts
    - Messages separated by pipe (|) character for easy setup
  - **NEW**: Added undo and progress tracking system (June 26, 2025)
    - undo command allows users to cancel task completion if marked by mistake
    - Removes user from completedBy array and unhides task if previously hidden
    - progress command shows completion percentage with visual progress bars
    - Progress tracking includes weekly breakdown and motivational messages
    - Multi-roadmap progress overview when user has access to multiple roadmaps
    - Color-coded progress indicators (red < 25%, orange < 50%, yellow < 75%, blue < 100%, green = 100%)
    - Enhanced progress command to view other users' progress via mentions (@user)
    - Fixed undo command color validation error that was causing crashes
  - **NEW**: Added comprehensive statistics and leaderboard system (June 26, 2025)
    - stats command shows detailed user statistics including completion time, streaks, and weekly breakdown
    - Support for viewing other users' statistics via mentions (@user)
    - Combined stats view when user has access to multiple roadmaps
    - Simulated completion time tracking and consistency streak calculations
    - leaderboard command displays server-wide rankings based on task completion
    - Leaderboard supports filtering by specific roadmap or showing combined results
    - Medal system for top performers (🥇🥈🥉) and server summary statistics
    - Both commands integrate with existing role-based permission system
  - **FIXED**: Resolved data corruption and Arabic text issues (June 26, 2025)
    - Fixed JSON corruption errors with atomic file operations and backup creation
    - Improved error handling in data manager with validation and recovery
    - Enhanced data integrity with proper structure validation before writes
    - Restored Arabic text for "يا سمكري" command prefix and "زعزوع" mentions per user request
    - Maintained English text for all other user-facing messages and descriptions

## Changelog

```
Changelog:
- June 25, 2025. Complete Discord bot with roadmap management
- June 25, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
Primary language: English
Bot usage: Discord roadmap management with mention-based permissions
System design: Hierarchical task display with week numbers and multiple link support
Task management: Number-based completion system with automatic ID reordering
Permission system: Mention-based instead of role-based restrictions
```