# AI Prompts Log

This document tracks all AI prompts used throughout the BMAD development process for the Smart Budget Application.

---

## Session 1 - Project Initialization
**Date**: 2025-11-10

### Prompt 1: BMAD Dev Assistant Activation
**Phase**: Initialization
**Purpose**: Activate BMAD Dev Assistant and establish project context

**Prompt**:
```
BMAD Dev Assistant (Short Version)

You are the BMAD Dev Assistant, an AI project collaborator for a Smart Budget Application.
Your role is to guide and generate deliverables through all BMAD phases — Analysis, Planning, Solutioning, and Implementation — following Agile principles.

Project Context:
The app helps users manage personal finances by adding income/expense records, categorizing transactions (e.g., Rent, Salary, Transport), and displaying spending summaries and charts. Optionally, it may include AI-based budget suggestions.

Your Responsibilities:
- Lead each BMAD phase step by step and produce concrete outputs.
- Provide structured deliverables:
  - Analysis: user personas, pain points, user stories, and requirements
  - Planning: data models, folder structure, and UI/component plan
  - Solutioning: tech stack, architecture, dependencies, and rationale
  - Implementation.
- Use clear commit prefixes: bmad/analysis, bmad/planning, etc.
- Keep all prompts in prompts.md and summarize AI usage in summary.md.
```

**Task**: Initialize project and create documentation files
**Output**: prompts.md and summary.md created

---

### Prompt 2: Create Documentation Files
**Phase**: Initialization
**Purpose**: Create prompts.md and summary.md for tracking AI usage

**Prompt**:
```
Create the md files
```

**Task**: Create prompts.md and summary.md
**Output**:
- [prompts.md](prompts.md) - AI prompts tracking document
- [summary.md](summary.md) - AI usage summary document
- Git commit: `bmad/init: Create project documentation tracking files`

---

### Prompt 3: Confirm Project Name
**Phase**: Workflow Initialization
**Purpose**: Confirm project name during workflow-init process

**Prompt**:
```
correct
```

**Task**: Confirm "SmartBudget" as project name
**Output**: Project name confirmed for workflow initialization

---

### Prompt 4: Detailed Project Description & Prompt Tracking Reminder
**Phase**: Workflow Initialization
**Purpose**: Provide comprehensive project description and establish prompt tracking requirement

**Prompt**:
```
I'm working on a Smart Budget Application, which is a personal finance management tool. The goal is to help users track their income and expenses, categorize transactions (like Rent, Salary, Transport), and visualize their spending through summaries and charts. Optionally, the app may provide AI-based suggestions for optimizing budgets.

The main purpose is to give users clear insights into their finances and help them make informed decisions. This project also serves as a way to demonstrate the BMAD methodology in a real development workflow — from Analysis → Planning → Solutioning → Implementation — while producing a clean, structured, and maintainable application.

Reminder: Save all my prompts in the prompts.md file. The file should contain all of my instructions and commands, given to you, ordered in chronological order! Update it regularly after every prompt and sync our chat till now if there is something missed.
```

**Task**: Store project description and establish prompt tracking workflow
**Output**: Project description captured; prompts.md updated with complete chronological history
**Notes**:
- Project goal: Personal finance management with income/expense tracking, categorization, and visualization
- Optional: AI-based budget suggestions
- Demonstrates BMAD methodology in practice
- Commitment to maintain chronological prompt tracking in prompts.md

---

### Prompt 5: Skip Discovery Workflows
**Phase**: Workflow Initialization
**Purpose**: Decline optional brainstorming and research workflows

**Prompt**:
```
d
```

**Task**: Skip discovery phase (brainstorm and research)
**Output**:
- brainstorm_requested = false
- research_requested = false
- Proceeding to track selection

---

### Prompt 6: Select BMad Method Track
**Phase**: Workflow Initialization
**Purpose**: Choose planning approach for the project

**Prompt**:
```
2
```

**Task**: Select BMad Method (full product planning)
**Output**:
- selected_track = "method"
- Will include: PRD + UX Design + Architecture + Sprint Planning + Story Development
- Planning time: 1-3 days
- Proceeding to product brief question

---

### Prompt 7: Include Product Brief
**Phase**: Workflow Initialization
**Purpose**: Decide whether to include Product Brief workflow

**Prompt**:
```
a
```

**Task**: Include Product Brief in workflow path
**Output**:
- product_brief_requested = true
- Product Brief will be first workflow in Phase 1 (Planning)
- Proceeding to generate workflow path

---

### Prompt 8: Create Workflow Tracking File
**Phase**: Workflow Initialization
**Purpose**: Confirm creation of workflow status tracking file

**Prompt**:
```
y
```

**Task**: Generate and save bmm-workflow-status.yaml
**Output**: Workflow tracking file created at docs/bmm-workflow-status.yaml
**Notes**: File will track progress through all BMad Method phases

---

### Prompt 9: Start Product Brief Workflow
**Phase**: Discovery/Planning
**Purpose**: Begin Product Brief workflow to define strategic product vision

**Prompt**:
```
1
```

**Task**: Start the Product Brief workflow
**Output**: Initiating /bmad:bmm:workflows:product-brief
**Notes**: This will help articulate product vision, target users, and strategic positioning

---

### Prompt 10: Product Brief Discovery - Initial Vision
**Phase**: Discovery/Product Brief
**Purpose**: Capture what sparked the idea and core problem context

**Prompt**:
```
What sparked this specific idea? - The desire to create a simple tool which makes budgeting easier.
Who is this primarily for? - A broader audience of everyday users who want to track and optimize their personal finances.
What about existing budgeting tools frustrated you or your potential users? - Existing tools are often too complex or lack clear visual insights, making budgeting feel tedious.
```

**Task**: Capture initial vision, problem context, and target audience
**Output**: Updating product brief with executive summary and initial vision
**Notes**:
- Spark: Simplicity in budgeting
- Target: Everyday users (broader audience)
- Gap: Existing tools too complex, lack visual insights, feel tedious

---

### Prompt 11: Continue Product Brief
**Phase**: Discovery/Product Brief
**Purpose**: Approve executive summary and continue to problem discovery

**Prompt**:
```
c
```

**Task**: Continue to Step 2 - Problem Discovery
**Output**: Proceeding to explore problem depth

---

### Prompt 12: Problem Discovery Deep Dive
**Phase**: Discovery/Product Brief
**Purpose**: Capture detailed problem statement, pain points, and impact

**Prompt**:
```
Current process: Users track income/expenses manually or with complex apps and spreadsheets.

Frustration point: Most of the tools are hard to navigate, and time-consuming.

Pain points: Difficult categorization, confusing charts, too many features, and slow updates.

Real cost: Overspending, missed savings goals, financial anxiety, and wasted time.

Deeper impact: Users feel stressed, lose control over finances, and often give up on budgeting altogether.
```

**Task**: Capture comprehensive problem statement and impact analysis
**Output**: Updating product brief with problem statement and problem impact sections
**Notes**:
- Current state: Manual tracking or complex tools/spreadsheets
- Key frustrations: Hard navigation, time-consuming, difficult categorization, confusing charts, feature bloat, slow updates
- Measurable costs: Overspending, missed savings, financial anxiety, wasted time
- Critical impact: Stress, loss of financial control, abandonment of budgeting

---

### Prompt 13: Continue to Solution Vision
**Phase**: Discovery/Product Brief
**Purpose**: Approve problem statement and move to solution exploration

**Prompt**:
```
c
```

**Task**: Continue to Step 3 - Solution Vision Discovery
**Output**: Proceeding to explore the proposed solution and differentiators

---

### Prompt 14: Solution Vision and Differentiation
**Phase**: Discovery/Product Brief
**Purpose**: Capture proposed solution, unique approach, and competitive differentiation

**Prompt**:
```
Magic moment: Users log a transaction and instantly see a clear, visual summary of their spending — everything clicks.

Categorization: Auto-suggestions and simple drag/drop make categorizing fast and intuitive.

Visualization: Clean, minimal charts highlight trends and actionable insights without clutter.

Unique approach: Focus on simplicity, clarity, and actionable visuals rather than overwhelming features.
AI suggestions: Optional insights help users optimize budgets and spot savings opportunities.

Differentiation: Unlike Mint or YNAB, it's lightweight, visually intuitive, and optionally AI-driven, not feature-heavy.

Why simplicity: Users need quick, clear insights to reduce stress and make budgeting sustainable.
```

**Task**: Capture proposed solution and key differentiators
**Output**: Updating product brief with proposed solution and key differentiators sections
**Notes**:
- Magic moment: Instant visual feedback on transaction entry
- Easy categorization: Auto-suggestions + drag/drop interface
- Clean visuals: Minimal charts with actionable insights
- Philosophy: Simplicity > feature bloat
- AI: Optional optimization and savings identification
- vs Mint/YNAB: Lightweight, visual-first, optional AI enhancement
- Core belief: Quick insights = reduced stress = sustainable budgeting

---

### Prompt 15: Continue to Target Users
**Phase**: Discovery/Product Brief
**Purpose**: Approve solution vision and move to target user exploration

**Prompt**:
```
c
```

**Task**: Continue to Step 4 - Target User Discovery
**Output**: Proceeding to explore primary and secondary user segments

---

### Prompt 16: Target User Discovery
**Phase**: Discovery/Product Brief
**Purpose**: Capture primary user segments, behaviors, and what they value

**Prompt**:
```
Ideal first user: A young professional with irregular spending who wants to track and save but feels overwhelmed by complex apps or spreadsheets.

Current behavior: Uses messy spreadsheets or abandoned feature-heavy budgeting apps, often giving up.

"Finally, someone gets it!" moment: Logs a transaction and immediately sees a clear, visual summary of spending and budget impact.

Immediate frustration solved: Simplifies categorization, reduces clutter, and provides instant insights.

Different user types:

Beginners: Need guidance and simplicity

Experienced users: Want fast, actionable insights

Young professionals: Track personal spending

Families: Manage household budgets collaboratively

Values: Clarity, simplicity, minimal setup, and actionable visual feedback.
```

**Task**: Capture primary and potential secondary user segments
**Output**: Updating product brief with primary users (young professionals/beginners) and secondary users (families/experienced users)
**Notes**:
- Primary: Young professionals with irregular spending, overwhelmed by complex tools
- Current state: Messy spreadsheets or abandoned apps
- Magic moment: Transaction → instant visual summary
- User spectrum: Beginners needing guidance to experienced users wanting speed
- Secondary: Families managing household budgets
- Core values: Clarity, simplicity, minimal setup, visual feedback

---

### Prompt 17: Continue to MVP Scope
**Phase**: Discovery/Product Brief
**Purpose**: Approve target users and move to MVP feature scoping

**Prompt**:
```
c
```

**Task**: Continue to Step 6 - MVP Scope Discovery
**Output**: Proceeding to explore core features and MVP boundaries

---

### Prompt 18: MVP Scope Definition
**Phase**: Discovery/Product Brief
**Purpose**: Define core MVP features vs. future enhancements

**Prompt**:
```
Absolute must-have: Users can log transactions and see them categorized.

Core features for "magic moment":

Quick transaction entry

Simple, intuitive categorization

Clear visual summaries/charts of spending

Tempting but non-essential for MVP:

AI budget suggestions

Multi-user/family support

Export or recurring transactions

Proof of concept: Young professionals can log transactions, see them categorized, and view actionable charts.

MVP line: Focus on simplicity, clarity, and immediate visual insight; everything else can wait for post-launch iterations.
```

**Task**: Capture core MVP features and out-of-scope items
**Output**: Updating product brief with core features, out of scope, and MVP success criteria
**Notes**:
- Core MVP: Transaction entry + categorization + visual summaries/charts
- Out of scope: AI suggestions, multi-user, export, recurring transactions
- Success metric: Young professionals logging, categorizing, and getting actionable insights
- Philosophy: Prove core value before expanding features

---

### Prompt 19: Review and Finalize Product Brief
**Phase**: Discovery/Product Brief
**Purpose**: Review completed product brief and finalize document

**Prompt**:
```
2
```

**Task**: Review and finalize the product brief
**Output**: Final review and completion of product brief workflow
**Notes**: User chose to review and finalize rather than add additional context

---

### Prompt 20: Save and Finalize Product Brief
**Phase**: Discovery/Product Brief
**Purpose**: Save finalized product brief and complete workflow

**Prompt**:
```
save
```

**Task**: Finalize and save product brief, update workflow status
**Output**:
- Product brief finalized at docs/product-brief-SmartBudget-2025-11-10.md
- Workflow status updated to mark product-brief as completed
- Ready to proceed to next workflow (PRD)

---

## Template for Future Prompts

### Prompt [N]: [Brief Title]
**Phase**: [Analysis/Planning/Solutioning/Implementation]
**Purpose**: [What this prompt aims to achieve]

**Prompt**:
```
[Full prompt text here]
```

**Task**: [Specific task requested]
**Output**: [Deliverables produced]
**Notes**: [Any relevant observations or decisions]

---
