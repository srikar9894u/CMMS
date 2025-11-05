# Multi-Agent CI/CD System

This directory contains artifacts created by the multi-agent software development system.

## Directory Structure

```
.agents/
├── work-packages/       # PM Agent creates feature specifications here
├── test-scenarios/      # Developer Agent creates test plans here
├── test-reports/        # QA Agent creates test results here
└── deployment-reports/  # DevOps Agent creates deployment logs here
```

## Agent Workflow

```
Issue/Feature → PM Agent → Developer Agent → QA Agent → DevOps Agent → Done
```

### 1. Product Manager Agent (`/agent-pm`)
- Analyzes requirements and creates work packages
- Output: `work-packages/WP-{timestamp}.json`
- Tags: `agent:ready-for-dev`

### 2. Developer Agent (`/agent-dev`)
- Implements features based on work package
- Output: `test-scenarios/TS-{timestamp}.json`
- Tags: `agent:ready-for-qa`

### 3. QA/Tester Agent (`/agent-qa`)
- Runs tests and validates implementation
- Output: `test-reports/TR-{timestamp}.json`
- Tags: `agent:ready-for-deploy` or `agent:needs-fixes`

### 4. DevOps/Deploy Agent (`/agent-devops`)
- Deploys to environments
- Output: `deployment-reports/DR-{timestamp}.json`
- Tags: Release tag

## Artifact Formats

### Work Package (PM → Dev)
```json
{
  "id": "WP-{timestamp}",
  "title": "Feature Title",
  "requirements": [],
  "acceptanceCriteria": [],
  "affectedFiles": []
}
```

### Test Scenarios (Dev → QA)
```json
{
  "workPackageId": "WP-{timestamp}",
  "testScenarios": [],
  "unitTests": "path"
}
```

### Test Report (QA → DevOps/Dev)
```json
{
  "workPackageId": "WP-{timestamp}",
  "testResults": {},
  "decision": "approved|needs-fixes"
}
```

### Deployment Report (DevOps → Complete)
```json
{
  "workPackageId": "WP-{timestamp}",
  "deploymentDate": "ISO timestamp",
  "status": "success"
}
```

## Usage

### Manual Mode (Slash Commands)
1. `/agent-pm` - Analyze requirements and create work package
2. `/agent-dev` - Implement the feature
3. `/agent-qa` - Test the implementation
4. `/agent-devops` - Deploy to production

### Automated Mode (CI/CD)
The agents run automatically via GitHub Actions:
- On issue creation → PM Agent
- On PR creation → Developer Agent
- On PR ready for review → QA Agent
- On merge to main → DevOps Agent

## Tips

- Each agent reads artifacts from previous agents
- Work packages link the entire workflow
- Use git tags for tracking: `agent:ready-for-{next}`
- Agents can send work backwards if issues are found
