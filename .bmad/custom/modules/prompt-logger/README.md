# Prompt Logger

**Automatic chat conversation logging for BMAD projects**

## Overview

Prompt Logger is a lightweight BMAD module that automatically captures every chat conversation to `prompts.md`. Philip, the chat logging specialist, works silently in the background to maintain a complete record of all your AI interactions.

This module provides:
- **Automatic conversation logging** - Every message and response captured
- **Silent operation** - No interruptions or confirmations needed
- **Chronological tracking** - Perfect order maintained
- **Privacy-first** - All logs stay local

## Installation

```bash
bmad install prompt-logger
```

## Components

### Agents (1)

**Philip** - Chat Logging Specialist 📝
- **Type:** Simple agent
- **Role:** Automatic conversation archivist
- **Personality:** Professional, minimal, silent
- **Operation:** Activates automatically when loaded

## Quick Start

1. **Load Philip:**

   ```
   agent philip
   ```

2. **Logging starts automatically:**
   - Philip begins monitoring immediately
   - Every exchange is appended to `prompts.md`
   - No further action needed

3. **Check status (optional):**
   ```
   *status
   ```

4. **Review logs:**
   - Open `prompts.md` in your project root
   - All conversations are chronologically ordered

## Module Structure

```
prompt-logger/
├── agents/
│   └── logger.agent.yaml       # Philip - Chat Logging Specialist
├── _module-installer/
│   └── install-config.yaml     # Installation configuration
└── README.md                   # This file
```

## Configuration

The module can be configured in `.bmad/prompt-logger/config.yaml`

Key settings:
- `prompts_log_path` - Path to log file (default: `{project-root}/prompts.md`)
- `log_format` - Format preference (default: `detailed`)
- `module_version` - Current version

## How It Works

**Automatic Operation:**

1. Load Philip agent
2. Philip's critical actions initialize logging
3. Embedded prompts contain logging instructions
4. Every chat exchange is automatically captured
5. Logs append to prompts.md in established format

**Silent by Design:**

- No status messages during normal operation
- No confirmations or acknowledgments
- Only surfaces errors when explicitly asked
- Maintains conversation flow naturally

## Log Format

Philip maintains the existing prompts.md format:

```markdown
## Session N - Description

**Date**: YYYY-MM-DD

### Prompt N: Title

**Phase**: Phase name
**Purpose**: Brief description

**Prompt**:
```
User message content
```

**Task**: What was requested
**Output**: What was delivered
**Notes**: Additional context

---
```

## Use Cases

- **Project Documentation** - Maintain complete project history
- **Learning & Review** - Review past conversations and decisions
- **Compliance & Audit** - Keep records for regulated industries
- **Knowledge Base** - Build searchable conversation archive
- **Debugging** - Trace issues back to original discussions

## Development Roadmap

### Phase 1: MVP ✅ (Current)
- [x] Automatic chat logging
- [x] Silent operation
- [x] Chronological tracking
- [x] Format preservation

### Phase 2: Enhanced Features ⏳ (Future)
- [ ] Session filtering and search
- [ ] Export to different formats
- [ ] Statistics and analytics
- [ ] Log rotation/archiving

### Phase 3: Advanced ⏳ (Future)
- [ ] Selective logging (include/exclude patterns)
- [ ] Multi-file organization
- [ ] Integration with workflow execution logging

## Technical Details

**Implementation:**

Philip uses an embedded `prompts` section rather than a separate workflow. This allows:
- Continuous background operation
- Lower overhead
- Simpler architecture
- Immediate activation

**Requirements:**

- BMAD v6 compatible project
- Existing `prompts.md` file in project root
- Write permissions to prompts.md

**Limitations:**

- Currently logs chat conversations only
- Does not capture internal workflow prompts (Phase 2 feature)
- Requires Philip to be active agent

## Contributing

To extend this module:

1. Load Philip agent definition
2. Modify embedded prompts for additional features
3. Update configuration as needed
4. Test with existing prompts.md format

## Author

Created by Desi on 2025-11-15

---

**Version:** 1.0.0
**Status:** MVP - Automatic chat logging
**License:** MIT
