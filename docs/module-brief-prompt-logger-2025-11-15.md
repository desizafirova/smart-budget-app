# Module Brief: BMM Prompt Logger

**Date:** 2025-11-15
**Author:** Desi
**Module Code:** prompt-logger
**Status:** Ready for Development

---

## Executive Summary

A lightweight BMAD module that wraps existing BMM workflows and logs every prompt and output into an already created file (prompts.md). Designed to maintain a record of all prompts used in workflows without altering the original workflows.

**Problem Solved:** Developers and teams using BMM workflows need to track and review the prompts and outputs generated during workflow execution for debugging, learning, or compliance purposes. Currently, there's no automated way to maintain this record without modifying workflows.

**Module Category:** Technical (Development/Debugging)
**Complexity Level:** Standard
**Target Users:** Development teams and solo developers using BMM workflows

---

## Module Identity

### Core Concept

**Module Code:** prompt-logger
**Module Name:** BMM Prompt Logger
**Target Audience:** Development teams and solo developers using BMM workflows

### Unique Value Proposition

What makes this module special:
- **Zero-touch logging** - no workflow modifications required
- **Wrapper pattern** - sits between user and existing workflows
- **Centralized documentation** in prompts.md
- **Lightweight and transparent** operation
- Works with existing prompts.md file (no initialization needed)

### Personality Theme

Professional and unobtrusive - like a diligent record keeper that works silently in the background.

---

## Agent Architecture

**Agent Count:** 1 (Simple Module)

### Agent Roster

#### Logger Agent (Simple Type)

**Role:** Workflow wrapper and prompt logging manager

**Personality:** Professional, quiet, and efficient - "I'm here to document everything, you won't even notice me."

**Key Capabilities:**
- Wrap existing BMM workflows with logging layer
- Capture all prompts and outputs during execution
- Append structured logs to prompts.md
- Manage log file (view recent entries, clear if needed)

**Signature Commands:**
- `wrap [workflow-name]` - Execute workflow with logging
- `view-recent` - Show latest log entries
- `clear-logs` - Clear or archive logs

### Agent Interaction Model

How agents work together:
Single agent module - Logger agent operates independently with no inter-agent communication needed.

---

## Workflow Ecosystem

### Core Workflows

Essential functionality that delivers primary value:

#### 1. wrap-workflow
- **Purpose:** Execute BMM workflow with transparent logging
- **Input:** Target BMM workflow path
- **Process:** Execute workflow, intercept prompts/outputs, append to existing prompts.md
- **Output:** Workflow result + logged entry in prompts.md
- **Complexity:** Standard
- **Key Features:**
  - Timestamp each entry
  - Preserve workflow execution exactly
  - Non-blocking logging
  - Append to existing `{project-root}/prompts.md`

### Feature Workflows

None - keeping module minimal and focused.

### Utility Workflows

None - viewing logs can be done by opening prompts.md directly.

**Note:** All logging appends to existing `{project-root}/prompts.md` file. No initialization workflow needed.

---

## User Scenarios

### Primary Use Case

**User Story:** As a developer using BMM workflows, I want to automatically log all prompts and outputs from workflow executions, so that I can review them later for debugging, learning, or compliance.

**User Journey:**

Step-by-step walkthrough of typical usage:

1. Developer loads Logger agent
2. Instead of running `/bmad:bmm:workflows:prd`, they run `wrap prd` (or similar command)
3. The workflow executes normally - user sees no difference in operation
4. All prompts sent to AI and outputs received are appended to prompts.md with timestamps
5. Developer can later open prompts.md to review the complete interaction history
6. This helps them understand workflow behavior, debug issues, or maintain audit trails

### Secondary Use Cases

- **Learning:** Reviewing past workflow runs to improve prompts
- **Compliance:** Maintaining audit trails for regulated industries
- **Education:** Learning how workflows generate outputs
- **Debugging:** Examining prompt/response patterns to troubleshoot issues

---

## Technical Planning

### Data Requirements

- Write access to existing `{project-root}/prompts.md`
- No external APIs or services needed
- No additional storage beyond prompts.md
- Minimal memory footprint (streaming writes)

### Integration Points

- Must integrate with all BMM workflows (wrapper pattern)
- No dependencies on other BMAD modules
- Needs to intercept workflow execution flow
- Must preserve original workflow behavior exactly

### Dependencies

None - fully standalone module.

### Technical Complexity Assessment

**Complexity Level:** Standard

**Reasoning:**
- Standalone module with no external dependencies
- Core challenge is the wrapper implementation pattern
- File I/O is straightforward (append operations)
- No complex state management needed
- Main technical hurdle: Intercepting prompts/outputs without modifying source workflows

**Key Technical Challenges:**
1. Intercepting prompts/outputs without modifying source workflows
2. Maintaining exact workflow behavior (transparent wrapper)
3. Handling workflow errors gracefully while still logging
4. Formatting log entries consistently

---

## Success Metrics

### Module Success Criteria

How we'll know the module is successful:

- ✅ Workflows execute identically whether wrapped or not (zero impact on behavior)
- ✅ 100% of prompts and outputs are captured in prompts.md
- ✅ Log entries are timestamped and clearly formatted
- ✅ No performance degradation during workflow execution
- ✅ Users can easily find and read logged information

### Quality Standards

**Reliability:**
- Never breaks wrapped workflows
- Graceful degradation if logging fails

**Transparency:**
- Invisible operation - users don't notice the wrapper
- No UI changes or intrusive notifications

**Accuracy:**
- Complete prompt/output capture without data loss
- Exact timestamps for each interaction

**Usability:**
- Clear, readable log format in prompts.md
- Easy to search and navigate logs

### Performance Targets

- **Logging overhead:** < 100ms per workflow step
- **File write operations:** Non-blocking, asynchronous
- **Memory usage:** Minimal (streaming writes, no buffering)
- **No memory leaks** during long workflow sessions

---

## Development Roadmap

### Phase 1: MVP (Minimum Viable Module)

**Timeline:** 1-2 days

**Components:**
- Logger agent with basic wrap command
- wrap-workflow workflow that executes BMM workflows and logs to prompts.md
- Basic log format (timestamp, workflow name, prompt, output)

**Deliverables:**
- Functional logger agent
- Working wrap-workflow
- Basic documentation in README.md
- Installation configuration

### Phase 2: Enhancement

**Timeline:** 1-2 days

**Components:**
- Improved log formatting (structured, searchable)
- Error handling and edge cases
- Additional agent commands (view-recent, search capabilities)
- Better delimiter formatting for log entries

**Deliverables:**
- Robust error handling
- Enhanced log format with metadata (workflow name, step number, duration)
- Extended agent commands
- Improved documentation

### Phase 3: Polish and Optimization

**Timeline:** 1 day

**Components:**
- Performance optimization (async logging)
- Log rotation/archiving features
- Configuration options (log format preferences)
- Unit tests for wrapper functionality

**Deliverables:**
- Optimized performance
- Configuration system for log preferences
- Complete documentation with examples
- Testing suite

---

## Creative Features

None - module focused on professional utility and transparency.

### Easter Eggs and Delighters

None - keeping it professional and minimal.

### Module Lore and Theming

The Logger agent is portrayed as a silent, meticulous archivist who believes every interaction has value and should be preserved for posterity.

---

## Risk Assessment

### Technical Risks

**Risk 1: Wrapper fails to capture all prompts/outputs**
- **Impact:** High - defeats the purpose of the module
- **Probability:** Medium
- **Mitigation:** Thorough testing with all BMM workflows; implement fallback logging mechanism; add validation checks

**Risk 2: Logging breaks workflow execution**
- **Impact:** Critical - would make module unusable
- **Probability:** Low with proper design
- **Mitigation:** Try-catch blocks around all logging operations; workflow continues even if logging fails; extensive error handling

**Risk 3: Large prompts.md file becomes unwieldy**
- **Impact:** Medium - reduces usability over time
- **Probability:** High with heavy usage
- **Mitigation:** Implement log rotation in Phase 3; document manual archiving process; consider date-based log splitting

### Usability Risks

**Risk 1: Users forget to use wrapper and miss logging**
- **Impact:** Medium - inconsistent logs
- **Probability:** Medium
- **Mitigation:** Clear documentation; consider making wrapped mode the default; add reminders in agent help

**Risk 2: Log format becomes hard to parse**
- **Impact:** Medium - reduces value of logs
- **Probability:** Low with good design
- **Mitigation:** Use consistent, structured format with clear delimiters; test readability with users; support export to structured formats

### Scope Risks

**Risk 1: Feature creep (adding analysis, dashboards, etc.)**
- **Impact:** Medium - delays delivery, increases complexity
- **Probability:** Medium
- **Mitigation:** Stick to core mission: lightweight logging only; defer advanced features to future modules or plugins

**Risk 2: Trying to support non-BMM workflows**
- **Impact:** Low - scope expansion
- **Probability:** Low
- **Mitigation:** Phase 1 focuses only on BMM workflows as stated; clearly document limitations

### Mitigation Strategies

**Overall Risk Management:**
1. Start with MVP - prove core wrapper concept works
2. Fail gracefully - never break workflows, even if logging fails
3. Test thoroughly - every BMM workflow should be tested
4. Document limitations - be clear about what's supported
5. Keep it simple - resist feature additions that complicate core functionality

---

## Implementation Notes

### Priority Order

1. **Core wrapper mechanism** - Get the workflow interception working correctly
2. **Logging functionality** - Reliable append to prompts.md with proper formatting
3. **Error handling** - Ensure workflows never break due to logging
4. **Documentation** - Clear usage instructions and examples

### Key Design Decisions

**Decision 1: Wrapper vs. Workflow Modification**
- Chose wrapper pattern to avoid modifying source workflows
- Maintains clean separation of concerns
- Allows logging to be added/removed without touching BMM code

**Decision 2: Single file (prompts.md) vs. Multiple files**
- Chose single file approach as specified by user
- Simpler to manage and review
- User already has prompts.md in place

**Decision 3: Synchronous vs. Asynchronous logging**
- Start with synchronous in MVP for simplicity
- Move to async in Phase 3 for performance
- Ensure no data loss during transition

**Decision 4: Minimal agent set (1 agent vs. 2+)**
- Chose single agent for simplicity
- Viewing logs can be done by opening prompts.md directly
- Keeps module focused and lightweight

### Open Questions

1. **Log format specification:** What exact format should log entries use? (JSON, markdown sections, custom format?)
2. **Workflow invocation:** How exactly will the wrapper intercept workflow execution? (Command alias, workflow reference modification, proxy pattern?)
3. **Error scenarios:** What happens if prompts.md is locked/unavailable during logging?
4. **Log size management:** At what file size should we warn users or auto-rotate?

---

## Resources and References

### Inspiration Sources

- Standard logging patterns in software development
- Middleware/wrapper patterns in web frameworks
- Audit trail systems in enterprise software

### Similar Modules

None currently in BMAD ecosystem - this would be a unique utility module.

### Technical References

- BMM workflow structure and execution model
- BMAD module architecture guidelines
- File I/O best practices for append operations
- Markdown formatting standards

---

## Appendices

### A. Detailed Agent Specifications

#### Logger Agent

**Agent Type:** Simple
**Communication Style:** Professional, concise, informative
**Primary Responsibilities:**
- Workflow wrapping and execution
- Prompt/output capture
- Log file management

**Command Set:**
- `wrap [workflow-name]` - Execute workflow with logging
- `view-recent [n]` - Show last n log entries (default: 10)
- `clear-logs` - Archive current logs and start fresh
- `help` - Show usage instructions

**Internal Functions:**
- Workflow execution interception
- Timestamp generation
- Markdown formatting
- File append operations
- Error handling and recovery

### B. Workflow Detailed Designs

#### wrap-workflow

**Inputs:**
- `target_workflow`: Path to BMM workflow to execute
- `workflow_args`: Arguments to pass to target workflow (optional)

**Steps:**
1. Validate target workflow exists
2. Initialize logging session with timestamp
3. Begin workflow execution
4. Intercept each prompt before sending to LLM
5. Log prompt with metadata (timestamp, workflow step, etc.)
6. Wait for LLM response
7. Log response/output
8. Continue workflow execution
9. Finalize log entry when workflow completes
10. Return workflow result to user

**Output:**
- Workflow execution result (unchanged from original)
- Side effect: Updated prompts.md with new log entries

**Error Handling:**
- If logging fails: Log error but continue workflow
- If workflow fails: Log error and propagate to user
- If prompts.md unavailable: Buffer logs in memory and retry

### C. Data Structures and Schemas

#### Log Entry Format (Initial Proposal)

```markdown
---
**Workflow Execution Log**
- **Workflow:** [workflow-name]
- **Timestamp:** [ISO-8601 datetime]
- **Duration:** [execution time]

### Prompts & Outputs

**Step 1: [step-name]**
Prompt:
```
[captured prompt text]
```

Output:
```
[captured output text]
```

[Repeat for each step]

---
```

### D. Integration Specifications

**Integration with BMM Workflows:**
- Wrapper must work with all BMM workflows without modification
- Preserve all workflow parameters and configuration
- Maintain exact workflow behavior and output
- No visible difference to end user (except logging)

**File System Integration:**
- Append-only operations to `{project-root}/prompts.md`
- Handle file locking gracefully
- Support concurrent logging if multiple workflows run

**BMAD Module Integration:**
- Follows standard module structure
- Uses standard config.yaml pattern
- Compatible with BMAD installer
- No dependencies on other modules

---

## Next Steps

1. **Review this brief** with stakeholders
2. **Run create-module workflow** using this brief as input
3. **Create logger agent** using create-agent workflow
4. **Develop wrap-workflow** using create-workflow
5. **Test with sample BMM workflow** to validate wrapper pattern
6. **Iterate based on testing** and refine implementation

---

_This Module Brief is ready to be fed directly into the create-module workflow for scaffolding and implementation._

**Module Viability Score:** 8/10
**Estimated Development Effort:** 3-5 days (across 3 phases)
**Confidence Level:** High - clear scope, proven patterns, minimal dependencies

---

**Approval for Development:**

- [x] Concept Approved
- [x] Scope Defined
- [x] Resources Available
- [x] Ready to Build

---

_Generated on 2025-11-15 by Desi using the BMAD Method Module Brief workflow_
