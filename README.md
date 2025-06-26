
### Core Concepts
- **Command System**: Modular commands loaded dynamically
- **Mention-based Permissions**: Flexible access via mentions, not roles
- **Embed UI**: Standardized embed responses using Discord colors
- **Weekly Task Management**: Organize by week/topic/task
- **Keep-Alive Server**: Express server for Replit & free hosting

---

## 📁 Main Components

### `bot.js`
- Initializes client & command loader
- Handles messages and executes commands
- Manages bot presence

### `server.js`
- Health check endpoints (`/`, `/status`)
- Prevents bot from going offline (Replit keep-alive)

### `utils/dataManager.js`
- Handles JSON read/write
- CRUD operations for roadmaps & tasks
- Backup + validation on every save

### `utils/embedBuilder.js`
- Templates for success, error, and info messages
- Consistent formatting across all commands

---

## 🧾 Commands Overview

### User Commands
- `create` → Create roadmap (admin only)
- `myroadmaps` → View roadmaps you have access to
- `showroadmap` → Display roadmap with tasks organized by week & topic
- `tasks` → List tasks for a roadmap
- `done <task#>` → Mark task as done
- `undo <task#>` → Undo completed task
- `progress` → See your progress (% + visual bars)
- `stats` → View your task stats
- `leaderboard` → Top users based on completion

### Admin Commands
- `addtask` → Add task with week, topic, and optional links
- `bulkaddtask` → Add multiple tasks using a pipe-separated format
- `emptyroadmap` → Delete all tasks in roadmap
- `deletetask` → Delete a specific task
- `dm` → Send DM to users with a role
- `clear` → Delete recent messages in a channel
- `autopost` → Recurring message posting in channel
- `schedule` → Manage recurring weekly tasks

### Bonus Features
- `poll`, `vote` → Run interactive polls
- `help` → Full command list in Egyptian Arabic
- "يا سمكري" prefix support in addition to `!`
- Smart detection for "زعزوع" mentions (with cooldown)

---

## 🔁 Data Flow

1. **Command triggers** (`!` or "يا سمكري")
2. **Permission checks** via mention/role
3. **Data operations** via `dataManager.js`
4. **Embed generation** via `embedBuilder.js`
5. **Bot replies** with clean UI

---

## ⚙️ Deployment Strategy

### Replit Hosting
- Express on port `5000`
- Auto-install `npm install`
- `.env` file includes bot token
- Runs `bot.js` and `server.js` in parallel

### File Storage
- `data.json` with full roadmap + task structure
- Auto-create on first run
- Includes backup & structure validation

---

## 🧩 External Dependencies

| Package      | Purpose                           |
|--------------|-----------------------------------|
| `discord.js` | Discord bot API interaction       |
| `express`    | HTTP server for uptime monitoring |
| `dotenv`     | Manage environment variables      |
| `fs`         | Read/write JSON file storage      |

---

## 🆕 Recent Changes (June 25–26, 2025)

- Full conversion from emoji to number-based task system
- New roadmap display: Week > Topic > Numbered Tasks
- Full English conversion + smart "يا سمكري" support
- Undo task support
- Progress tracking with colors & bars
- Leaderboard + stats + medals 🥇🥈🥉
- autopost system with interval message rotation
- Admin DM tool for private comms
- JSON corruption protection with backup
- Bulk task creation via pipe-separated input
- Smart mention-based permissions
- Rewritten commands with cleaner UX

---

## 📊 Progress & Stats Example

