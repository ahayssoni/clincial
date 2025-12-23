# CLAUDE.md - AI Assistant Guide for clincial

**Last Updated:** 2025-12-23
**Repository:** ahayssoni/clincial
**Current Status:** Initial Bootstrap Phase

---

## Table of Contents

1. [Repository Overview](#repository-overview)
2. [Project Purpose](#project-purpose)
3. [Codebase Structure](#codebase-structure)
4. [Development Workflow](#development-workflow)
5. [Git Conventions](#git-conventions)
6. [Code Style & Conventions](#code-style--conventions)
7. [Testing Practices](#testing-practices)
8. [Deployment](#deployment)
9. [AI Assistant Guidelines](#ai-assistant-guidelines)
10. [Common Tasks](#common-tasks)

---

## Repository Overview

**Repository Name:** clincial
**Repository URL:** ahayssoni/clincial
**Initial Commit:** 2cc97f2 - December 12, 2025
**Current Branch:** claude/add-claude-documentation-eaGrw
**Project Stage:** Early initialization - project structure and technology stack to be determined

### Current State

This repository is in its initial bootstrap phase. It currently contains:
- Git configuration and metadata
- Minimal README.md with project title only
- This CLAUDE.md documentation file

**No technology stack has been chosen yet.** The project awaits initial setup and code implementation.

---

## Project Purpose

> **Status:** To be defined

The project name "clincial" suggests a potential medical/clinical domain application, but the exact purpose, scope, and objectives have not yet been documented.

**When defining the project:**
- Update the README.md with a clear project description
- Document the target users and use cases
- Specify the problem being solved
- Update this section with the project's mission and goals

---

## Codebase Structure

> **Status:** Not yet established

### Expected Structure (Template)

Once the project begins development, document the directory structure here:

```
clincial/
├── src/              # Source code (adjust based on chosen language)
├── tests/            # Test files
├── docs/             # Additional documentation
├── config/           # Configuration files
├── scripts/          # Build/deployment scripts
├── .github/          # GitHub workflows and templates
├── README.md         # Project overview and setup instructions
├── CLAUDE.md         # This file - AI assistant guide
└── [other files]     # Based on chosen technology stack
```

**Update this section when:**
- Initial project structure is created
- New major directories are added
- Architecture patterns are established

---

## Development Workflow

### Branch Strategy

This project uses feature branches with a specific naming convention:

**Branch Naming Pattern:** `claude/[description]-[session-id]`

**Example:** `claude/add-claude-documentation-eaGrw`

**Rules:**
- All development branches MUST start with `claude/`
- All development branches MUST end with the matching session ID
- Branch names should be descriptive and kebab-case
- Never push to branches that don't match this pattern (will fail with 403)

### Development Process

1. **Create/checkout feature branch:**
   ```bash
   git checkout -b claude/[feature-description]-[session-id]
   ```

2. **Make changes and commit:**
   ```bash
   git add [files]
   git commit -m "Clear, descriptive commit message"
   ```

3. **Push to remote:**
   ```bash
   git push -u origin claude/[branch-name]
   ```
   - If network errors occur, retry up to 4 times with exponential backoff (2s, 4s, 8s, 16s)

4. **Create pull request** (when requested):
   ```bash
   gh pr create --title "PR title" --body "PR description"
   ```

### Commit Message Guidelines

**Format:** Use clear, imperative mood commit messages

**Good examples:**
- "Add user authentication module"
- "Fix null pointer exception in data parser"
- "Update documentation for API endpoints"
- "Refactor database connection logic"

**Bad examples:**
- "updates" (too vague)
- "Fixed stuff" (not descriptive)
- "WIP" (work in progress should not be final commit message)

**Structure for detailed commits:**
```
Brief summary (50 chars or less)

More detailed explanation if needed. Wrap at 72 characters.
Explain the problem this commit solves and why this approach
was chosen.

- Bullet points are okay
- Use present tense: "Add feature" not "Added feature"
```

---

## Git Conventions

### Network Resilience

All git network operations (push, fetch, pull) should implement retry logic:

**Retry strategy:**
- Maximum 4 retry attempts
- Exponential backoff: 2s, 4s, 8s, 16s
- Only retry on network failures, not authentication/permission errors

**Example retry implementation:**
```bash
# Push with retry logic
for i in 1 2 3 4; do
  git push -u origin [branch-name] && break ||
  ([ $i -lt 4 ] && sleep $((2**i)) || exit 1)
done
```

### Fetching and Pulling

**Prefer specific branches:**
```bash
git fetch origin [branch-name]
git pull origin [branch-name]
```

**Avoid:**
```bash
git fetch --all  # Too broad, slower
git pull         # Ambiguous source
```

---

## Code Style & Conventions

> **Status:** To be established based on chosen technology stack

### General Principles

Regardless of technology chosen, follow these principles:

1. **Simplicity over cleverness** - Write clear, readable code
2. **Avoid over-engineering** - Don't add features not explicitly requested
3. **Security first** - Always consider OWASP top 10 vulnerabilities
4. **Minimal abstraction** - Don't create abstractions for one-time use
5. **No premature optimization** - Optimize when there's a proven need

### Code Quality Standards

**DO:**
- Write self-documenting code with clear variable/function names
- Add comments only where logic isn't self-evident
- Validate at system boundaries (user input, external APIs)
- Handle errors gracefully
- Keep functions focused and single-purpose

**DON'T:**
- Add features beyond what was requested
- Refactor working code unnecessarily
- Add error handling for impossible scenarios
- Create helper functions for one-time operations
- Use feature flags without explicit requirement

### Security Guidelines

Always protect against:
- **Command Injection** - Sanitize all shell/system commands
- **XSS (Cross-Site Scripting)** - Escape user input in HTML/JS
- **SQL Injection** - Use parameterized queries
- **Path Traversal** - Validate file paths
- **Authentication/Authorization** - Properly implement access controls
- **Sensitive Data Exposure** - Never commit secrets, API keys, passwords

**Never commit:**
- `.env` files with secrets
- `credentials.json` or similar
- API keys or tokens
- Private keys
- Database passwords

---

## Testing Practices

> **Status:** To be established

### Testing Strategy (Template)

Once a testing framework is chosen, document:

1. **Test types used:**
   - Unit tests
   - Integration tests
   - End-to-end tests
   - Other (specify)

2. **Testing framework:** [To be determined]

3. **Running tests:**
   ```bash
   # Command to run all tests
   # Command to run specific tests
   # Command to run with coverage
   ```

4. **Test coverage requirements:**
   - Minimum coverage percentage (if any)
   - Critical paths that must be tested
   - Areas that can skip tests

5. **Writing tests:**
   - Test file naming conventions
   - Test organization patterns
   - Mock/stub strategies

---

## Deployment

> **Status:** Not yet configured

### Deployment Process (Template)

When deployment is set up, document:

1. **Deployment environments:**
   - Development
   - Staging
   - Production

2. **Deployment methods:**
   - Manual deployment steps
   - Automated CI/CD pipelines
   - Container orchestration

3. **Pre-deployment checklist:**
   - Tests passing
   - Code reviewed
   - Documentation updated
   - Version bumped

4. **Rollback procedures:**
   - How to rollback a failed deployment
   - Recovery steps

---

## AI Assistant Guidelines

### Working with This Repository

**Before making changes:**

1. **Read before writing** - Always read files before modifying them
2. **Understand context** - Review related files to understand the codebase
3. **Check for patterns** - Look for existing code patterns to maintain consistency
4. **Search comprehensively** - Use search tools to find all occurrences

**When implementing features:**

1. **Use TodoWrite tool** - Track tasks and show progress
2. **Ask for clarification** - If requirements are unclear, ask before implementing
3. **Make focused changes** - Only change what's necessary
4. **Test your changes** - Run tests if they exist
5. **Update documentation** - Keep CLAUDE.md and other docs current

**Code modification workflow:**

```
1. Read relevant files
2. Plan changes (use TodoWrite for complex tasks)
3. Make minimal necessary changes
4. Test changes
5. Commit with clear message
6. Update documentation if needed
```

### Tool Usage Preferences

**For file operations:**
- Use `Read` for reading files (not `cat`)
- Use `Edit` for modifying files (not `sed/awk`)
- Use `Write` for creating new files (not `echo >`)
- Use `Glob` for finding files by pattern (not `find`)
- Use `Grep` for searching file contents (not `grep/rg`)

**For exploration:**
- Use `Task` tool with `subagent_type=Explore` for codebase exploration
- Don't manually search when exploring architecture or patterns
- Use specialized agents for complex multi-step tasks

**For git operations:**
- Use `Bash` tool for git commands
- Always include descriptive `description` parameter
- Run independent commands in parallel when possible
- Chain dependent commands with `&&`

### Communication Style

**When interacting with users:**
- Be concise and direct
- Don't use emojis unless explicitly requested
- Focus on technical accuracy over validation
- Provide objective guidance, even if it disagrees with user assumptions
- Output text directly, never use bash echo to communicate

### Security Awareness

**Always check for:**
- Hardcoded credentials or secrets
- SQL injection vulnerabilities
- Command injection risks
- XSS vulnerabilities
- Insecure file operations
- OWASP top 10 vulnerabilities

**If you introduce a vulnerability:**
- Immediately fix it
- Explain what was wrong
- Provide the secure alternative

### Error Handling

**When encountering errors:**
1. Read and understand the error message
2. Check relevant code and configuration
3. Search for similar issues in the codebase
4. Propose a fix with explanation
5. Test the fix if possible

**Don't:**
- Ignore errors and continue
- Make blind changes hoping they'll work
- Add generic try/catch blocks without proper handling

---

## Common Tasks

### Initial Project Setup (Pending)

When setting up the project for the first time:

1. **Choose technology stack**
   - Decide on primary language/framework
   - Document the choice and rationale in README.md
   - Update this CLAUDE.md with stack-specific information

2. **Initialize project structure**
   - Create directory structure
   - Add configuration files
   - Set up dependency management
   - Update "Codebase Structure" section above

3. **Set up development tools**
   - Linters and formatters
   - Testing framework
   - Build tools
   - CI/CD pipelines

4. **Create documentation**
   - Expand README.md with setup instructions
   - Add inline code documentation
   - Create API documentation if needed
   - Add CONTRIBUTING.md if open source

5. **Security setup**
   - Add `.gitignore` to exclude sensitive files
   - Set up environment variable management
   - Configure security scanning tools
   - Add dependency vulnerability checking

### Future Common Tasks (Template)

Once the project is active, document common tasks here:

**Running the application locally:**
```bash
# Commands to start the application
```

**Building the project:**
```bash
# Commands to build
```

**Running tests:**
```bash
# Commands to run tests
```

**Database operations:**
```bash
# Migration commands
# Seeding commands
```

**Debugging:**
```bash
# How to enable debug mode
# Where to find logs
```

---

## Updating This Document

This CLAUDE.md file should be updated whenever:

- Project structure changes significantly
- New development workflows are established
- Technology stack is chosen or changes
- Coding conventions are defined or modified
- New common tasks are identified
- Deployment processes change
- Testing practices are established or updated

**Update frequency:** Keep this document current with the codebase. An outdated CLAUDE.md is worse than no CLAUDE.md.

**Ownership:** This document is maintained collectively. Any AI assistant or developer working on the project should update it when making significant changes.

---

## Questions or Issues

If you encounter situations not covered in this guide:

1. Check the README.md for additional context
2. Review existing code for patterns and conventions
3. Search for similar examples in the codebase
4. Ask the user for clarification
5. Update this document with the resolution

---

**Document Version:** 1.0.0
**Created by:** AI Assistant (Claude)
**Last Updated:** 2025-12-23
