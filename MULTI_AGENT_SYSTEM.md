# Multi-Agent CI/CD System

## Overview

This project uses a **Multi-Agent Software Development System** where specialized AI agents work together like a software company to deliver features from requirements to deployment.

## Architecture

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│ PM Agent    │─────▶│ Developer   │─────▶│ QA Agent    │─────▶│ DevOps      │
│             │      │ Agent       │      │             │      │ Agent       │
│ Analyze     │      │ Implement   │      │ Test        │      │ Deploy      │
│ Requirements│      │ Features    │      │ Validate    │      │ Release     │
└─────────────┘      └─────────────┘      └─────────────┘      └─────────────┘
       │                    │                    │                    │
       ▼                    ▼                    ▼                    ▼
  Work Package         Test Scenarios       Test Report       Deployment Report
```

## The Four Agents

### 1. 🔍 Product Manager Agent (`/agent-pm`)

**Role:** Requirement Analysis & Specification

**Triggers:**
- Automated: New issue created
- Manual: Run `/agent-pm` command

**Responsibilities:**
- Analyze feature requests and bug reports
- Create detailed technical specifications
- Define acceptance criteria
- Identify affected components
- Create work packages for developers

**Output:** `WP-{timestamp}.json` in `.agents/work-packages/`

**Example Work Package:**
```json
{
  "id": "WP-1704067200",
  "issueNumber": 42,
  "title": "Add real-time asset monitoring dashboard",
  "requirements": [
    "Display asset status in real-time",
    "Show OPC-UA data streams",
    "Alert on critical events"
  ],
  "acceptanceCriteria": [
    "Dashboard updates every 5 seconds",
    "Shows all connected assets",
    "Displays alerts prominently"
  ],
  "affectedFiles": [
    "frontend/src/pages/Dashboard.tsx",
    "backend/src/routes/assets.routes.ts"
  ],
  "priority": "high",
  "nextAgent": "developer"
}
```

---

### 2. 👨‍💻 Developer Agent (`/agent-dev`)

**Role:** Feature Implementation

**Triggers:**
- Automated: Pull request opened
- Manual: Run `/agent-dev` command

**Responsibilities:**
- Read work packages from PM Agent
- Implement features following best practices
- Write clean, maintainable code
- Add proper error handling and logging
- Create test scenarios for QA

**Output:** `TS-{timestamp}.json` in `.agents/test-scenarios/`

**Example Test Scenarios:**
```json
{
  "id": "TS-1704067300",
  "workPackageId": "WP-1704067200",
  "prNumber": 45,
  "implementedFiles": [
    "frontend/src/pages/Dashboard.tsx",
    "backend/src/routes/assets.routes.ts",
    "backend/src/services/realtime.service.ts"
  ],
  "testScenarios": [
    {
      "scenario": "Real-time asset data updates",
      "steps": [
        "Navigate to dashboard",
        "Observe asset data",
        "Wait 5 seconds",
        "Verify data refreshed"
      ],
      "expectedResult": "Data updates without page reload",
      "edgeCases": ["No assets connected", "Network failure"]
    }
  ],
  "nextAgent": "qa"
}
```

---

### 3. 🧪 QA/Tester Agent (`/agent-qa`)

**Role:** Quality Assurance & Testing

**Triggers:**
- Automated: PR marked ready for review
- Manual: Run `/agent-qa` command

**Responsibilities:**
- Run test suites (unit, integration, E2E)
- Validate acceptance criteria
- Test edge cases
- Check for security issues
- Create comprehensive test reports
- Approve or send back to developer

**Output:** `TR-{timestamp}.json` in `.agents/test-reports/`

**Example Test Report:**
```json
{
  "id": "TR-1704067400",
  "workPackageId": "WP-1704067200",
  "prNumber": 45,
  "testDate": "2024-01-01T00:30:00Z",
  "testResults": {
    "passed": [
      "Dashboard renders correctly",
      "Real-time updates working",
      "Alerts display properly"
    ],
    "failed": [],
    "warnings": [
      "Network error handling could be improved"
    ]
  },
  "acceptanceCriteriaStatus": {
    "Dashboard updates every 5 seconds": "✅ Passed",
    "Shows all connected assets": "✅ Passed",
    "Displays alerts prominently": "✅ Passed"
  },
  "decision": "approved",
  "nextAgent": "devops"
}
```

---

### 4. 🚀 DevOps/Deploy Agent (`/agent-devops`)

**Role:** Deployment & Infrastructure

**Triggers:**
- Automated: Merge to main/develop branch
- Manual: Run `/agent-devops` command

**Responsibilities:**
- Build Docker images
- Run deployment processes
- Execute smoke tests
- Monitor deployment health
- Create deployment reports
- Tag releases

**Output:** `DR-{timestamp}.json` in `.agents/deployment-reports/`

**Example Deployment Report:**
```json
{
  "id": "DR-1704067500",
  "workPackageId": "WP-1704067200",
  "deploymentDate": "2024-01-01T01:00:00Z",
  "environment": "production",
  "deployedServices": [
    "frontend:1.2.0",
    "backend:1.2.0",
    "opc-service:1.0.0"
  ],
  "smokeTestResults": {
    "frontend": "✅ Healthy",
    "backend": "✅ Healthy",
    "database": "✅ Connected"
  },
  "status": "success",
  "completedWorkPackage": true
}
```

---

## Usage Modes

### 🤖 Automated Mode (CI/CD Pipeline)

The agents run automatically via GitHub Actions:

**Workflow:**

1. **User creates an issue** with feature request
   - ✅ PM Agent automatically analyzes it
   - ✅ Creates work package
   - ✅ Labels: `agent:ready-for-dev`

2. **Developer creates PR**
   - ✅ Developer Agent reviews code
   - ✅ Runs TypeScript checks
   - ✅ Creates test scenarios
   - ✅ Labels: `agent:ready-for-qa`

3. **PR marked ready for review**
   - ✅ QA Agent runs all tests
   - ✅ Validates acceptance criteria
   - ✅ Creates test report
   - ✅ Labels: `agent:ready-for-deploy`
   - ✅ Approves PR if tests pass

4. **PR merged to main**
   - ✅ DevOps Agent deploys
   - ✅ Creates deployment report
   - ✅ Tags release

**Configuration:** `.github/workflows/agent-pipeline.yml`

---

### 🎮 Manual Mode (Slash Commands)

You can invoke agents manually using Claude Code:

```bash
# 1. Product Manager Agent
/agent-pm
# Analyzes current issue/requirement
# Creates work package

# 2. Developer Agent
/agent-dev
# Reviews work package
# Implements features
# Creates test scenarios

# 3. QA Agent
/agent-qa
# Runs test suites
# Validates implementation
# Creates test report

# 4. DevOps Agent
/agent-devops
# Deploys to environment
# Creates deployment report
```

---

## Directory Structure

```
CMMS/
├── .agents/                          # Agent artifacts
│   ├── work-packages/               # PM Agent outputs
│   │   └── WP-*.json
│   ├── test-scenarios/              # Developer Agent outputs
│   │   └── TS-*.json
│   ├── test-reports/                # QA Agent outputs
│   │   └── TR-*.json
│   ├── deployment-reports/          # DevOps Agent outputs
│   │   └── DR-*.json
│   └── README.md
│
├── .claude/
│   └── commands/                    # Agent slash commands
│       ├── agent-pm.md
│       ├── agent-dev.md
│       ├── agent-qa.md
│       └── agent-devops.md
│
└── .github/
    └── workflows/
        └── agent-pipeline.yml       # Automated workflow
```

---

## Benefits

### 🎯 Quality Assurance
- Every feature goes through 4 stages of review
- Automated testing at each step
- Consistent quality standards

### 📋 Documentation
- Complete audit trail from requirement to deployment
- JSON artifacts for tracking
- Clear handoffs between stages

### ⚡ Efficiency
- Parallel work on different features
- Automated CI/CD pipeline
- Reduced human error

### 🔄 Consistency
- Standard processes for all features
- Predictable workflows
- Clear responsibilities

---

## Example End-to-End Workflow

### Scenario: Add Real-Time Asset Monitoring

**Day 1 - Morning:**
```
1. User creates issue: "Add real-time asset monitoring dashboard"
2. PM Agent (automated):
   - Analyzes requirement
   - Creates work package WP-1704067200
   - Labels issue: agent:ready-for-dev
   - Comments on issue with analysis
```

**Day 1 - Afternoon:**
```
3. Developer creates PR #45 with implementation
4. Developer Agent (automated):
   - Reviews PR
   - Runs TypeScript checks
   - Creates test scenarios TS-1704067300
   - Labels PR: agent:ready-for-qa
```

**Day 2 - Morning:**
```
5. Developer marks PR as ready for review
6. QA Agent (automated):
   - Runs all test suites
   - Validates acceptance criteria
   - Creates test report TR-1704067400
   - Approves PR
   - Labels: agent:ready-for-deploy
```

**Day 2 - Afternoon:**
```
7. PR merged to main
8. DevOps Agent (automated):
   - Builds Docker images
   - Deploys to production
   - Creates deployment report DR-1704067500
   - Feature is live! 🎉
```

---

## Configuration

### GitHub Actions Secrets

Ensure these are set in your repository:
- `GITHUB_TOKEN` (automatically available)

### Labels

The pipeline uses these labels:
- `agent:pm-review` - Trigger PM Agent
- `agent:ready-for-dev` - Work package ready
- `agent:needs-fixes` - Send back to developer
- `agent:ready-for-qa` - Ready for testing
- `agent:ready-for-deploy` - Ready for deployment
- `agent:processed-by-pm` - PM Agent completed
- `agent:processed-by-dev` - Developer Agent completed
- `agent:processed-by-qa` - QA Agent completed

Create these labels in your GitHub repository:
```bash
gh label create "agent:pm-review" --color "0E8A16" --description "Trigger PM Agent"
gh label create "agent:ready-for-dev" --color "1D76DB" --description "Ready for development"
gh label create "agent:ready-for-qa" --color "FBCA04" --description "Ready for QA"
gh label create "agent:ready-for-deploy" --color "5319E7" --description "Ready for deployment"
gh label create "agent:needs-fixes" --color "D93F0B" --description "Needs fixes from developer"
```

---

## Monitoring & Debugging

### View Agent Activity

**GitHub Actions:**
- Go to "Actions" tab in GitHub
- Select "Multi-Agent CI/CD Pipeline"
- View individual agent jobs

**Local Artifacts:**
```bash
# View work packages
ls .agents/work-packages/

# View latest work package
cat .agents/work-packages/WP-*.json | jq .

# View test reports
cat .agents/test-reports/TR-*.json | jq .
```

### Debug Mode

To see detailed agent logs:
1. Go to GitHub Actions
2. Select a workflow run
3. Click on individual agent jobs
4. Expand steps to see logs

---

## Customization

### Add New Agent Roles

1. Create new command: `.claude/commands/agent-{role}.md`
2. Add job in `.github/workflows/agent-pipeline.yml`
3. Create artifact directory: `.agents/{role}-outputs/`
4. Update documentation

### Modify Agent Behavior

Edit the agent command files in `.claude/commands/`:
- `agent-pm.md` - PM Agent behavior
- `agent-dev.md` - Developer Agent behavior
- `agent-qa.md` - QA Agent behavior
- `agent-devops.md` - DevOps Agent behavior

### Customize Triggers

Edit `.github/workflows/agent-pipeline.yml`:
- Change event triggers
- Add/remove conditions
- Modify agent logic

---

## Best Practices

### 1. Clear Requirements
- Write detailed issue descriptions
- Include acceptance criteria
- Add screenshots or mockups

### 2. Meaningful Commits
- Reference issue numbers
- Describe what changed and why
- Use conventional commits

### 3. Test Coverage
- Write tests for new features
- Update tests for changes
- Include edge cases

### 4. Review Agent Outputs
- Check work packages before coding
- Validate test scenarios
- Review deployment reports

### 5. Use Labels
- Apply appropriate agent labels
- Use `agent:needs-fixes` to loop back
- Track agent processing status

---

## Troubleshooting

### Agent Not Triggering

**Problem:** Agent workflow didn't run

**Solutions:**
- Check if workflow file syntax is valid
- Verify GitHub Actions are enabled
- Check if labels are correct
- Review workflow conditions

### Test Failures

**Problem:** QA Agent reports test failures

**Solutions:**
- Check test reports in `.agents/test-reports/`
- Run tests locally: `npm test`
- Fix issues and push again
- QA Agent will re-run automatically

### Deployment Issues

**Problem:** DevOps Agent deployment failed

**Solutions:**
- Check deployment logs in GitHub Actions
- Verify Docker configurations
- Check environment variables
- Review deployment report in `.agents/deployment-reports/`

---

## FAQ

**Q: Can I skip agents?**
A: Yes, in manual mode you can run any agent independently. In automated mode, use labels to control flow.

**Q: How do I loop back to a previous agent?**
A: Use the `agent:needs-fixes` label to send work back to the Developer Agent.

**Q: Can agents work in parallel?**
A: Agents work sequentially by design for quality gates. However, multiple features can be in different stages simultaneously.

**Q: How do I disable automated mode?**
A: Comment out or delete `.github/workflows/agent-pipeline.yml`

**Q: Can I add custom agents?**
A: Yes! Create new command files and add jobs to the pipeline.

---

## Support

- **Documentation:** This file
- **Agent Configs:** `.claude/commands/agent-*.md`
- **Pipeline Config:** `.github/workflows/agent-pipeline.yml`
- **Artifacts:** `.agents/` directory

---

## License

This multi-agent system is part of the CMMS project.
