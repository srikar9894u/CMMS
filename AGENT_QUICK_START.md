# Multi-Agent System - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Create GitHub Labels

Run this command to create all required labels:

```bash
# Using GitHub CLI
gh label create "agent:pm-review" --color "0E8A16"
gh label create "agent:ready-for-dev" --color "1D76DB"
gh label create "agent:ready-for-qa" --color "FBCA04"
gh label create "agent:ready-for-deploy" --color "5319E7"
gh label create "agent:needs-fixes" --color "D93F0B"
gh label create "agent:processed-by-pm" --color "C2E0C6"
gh label create "agent:processed-by-dev" --color "BFD4F2"
gh label create "agent:processed-by-qa" --color "FEF2C0"
```

Or use the helper script:

```bash
npm run setup:agents
```

### Step 2: Test the System

#### Option A: Automated Mode (CI/CD)

1. **Create a test issue:**
   ```bash
   gh issue create --title "Test: Add hello world endpoint" --body "Create a simple GET /hello endpoint that returns 'Hello World'"
   ```

2. **Watch the PM Agent work:**
   - Go to GitHub Actions tab
   - See PM Agent analyze the issue
   - Check the issue for PM Agent's comment

3. **Create a PR to implement:**
   ```bash
   git checkout -b test-hello-world
   # Make your changes
   git add .
   git commit -m "Add hello world endpoint"
   git push -u origin test-hello-world
   gh pr create --title "Add hello world endpoint" --body "Implements #1"
   ```

4. **Watch the pipeline:**
   - Developer Agent checks the code
   - Mark PR as "Ready for review"
   - QA Agent runs tests
   - Merge to main
   - DevOps Agent deploys

#### Option B: Manual Mode (Slash Commands)

1. **In Claude Code, run:**
   ```bash
   /agent-pm
   ```
   Tell it: "I want to add a health check endpoint"

2. **Then run:**
   ```bash
   /agent-dev
   ```
   It will implement the feature

3. **Then run:**
   ```bash
   /agent-qa
   ```
   It will test the implementation

4. **Finally run:**
   ```bash
   /agent-devops
   ```
   It will prepare deployment

### Step 3: View Results

```bash
# View work packages
cat .agents/work-packages/*.json | jq .

# View test reports
cat .agents/test-reports/*.json | jq .

# View deployment reports
cat .agents/deployment-reports/*.json | jq .
```

---

## 📋 Common Workflows

### Workflow 1: New Feature Request

```
User creates issue → PM Agent analyzes → Dev Agent implements → QA tests → DevOps deploys
```

**Steps:**
1. Create GitHub issue with feature description
2. Wait for PM Agent to analyze (or run `/agent-pm`)
3. Create PR with implementation
4. Wait for Developer Agent to review
5. Mark PR as ready for review
6. Wait for QA Agent to test
7. Merge to main
8. DevOps Agent deploys automatically

### Workflow 2: Bug Fix

```
Bug report → PM Agent triages → Dev Agent fixes → QA validates → Deploy
```

**Steps:**
1. Create issue with `bug` label
2. PM Agent analyzes and creates work package
3. Fix the bug and create PR
4. Pipeline automatically validates and deploys

### Workflow 3: Manual Development Session

```
/agent-pm → /agent-dev → /agent-qa → /agent-devops
```

**Steps:**
1. Run `/agent-pm` with your requirement
2. Run `/agent-dev` to implement
3. Run `/agent-qa` to test
4. Run `/agent-devops` to deploy

---

## 🎯 Quick Commands

### GitHub CLI

```bash
# Create issue
gh issue create --title "Feature: Title" --body "Description"

# View issues
gh issue list --label "agent:ready-for-dev"

# Create PR
gh pr create --title "Title" --body "Description"

# View workflow runs
gh run list --workflow=agent-pipeline.yml

# View specific run
gh run view <run-id>
```

### npm Scripts (Add to package.json)

```json
{
  "scripts": {
    "agents:setup": "node scripts/setup-agent-labels.js",
    "agents:status": "node scripts/agent-status.js",
    "agents:clean": "rm -rf .agents/*/",
    "agents:list": "find .agents -name '*.json' -exec echo {} \\; -exec cat {} \\;"
  }
}
```

---

## 🔧 Helper Scripts

Create `scripts/setup-agent-labels.js`:

```javascript
const { execSync } = require('child_process');

const labels = [
  { name: 'agent:pm-review', color: '0E8A16', desc: 'Trigger PM Agent' },
  { name: 'agent:ready-for-dev', color: '1D76DB', desc: 'Ready for development' },
  { name: 'agent:ready-for-qa', color: 'FBCA04', desc: 'Ready for QA' },
  { name: 'agent:ready-for-deploy', color: '5319E7', desc: 'Ready for deployment' },
  { name: 'agent:needs-fixes', color: 'D93F0B', desc: 'Needs fixes' },
  { name: 'agent:processed-by-pm', color: 'C2E0C6', desc: 'PM processed' },
  { name: 'agent:processed-by-dev', color: 'BFD4F2', desc: 'Dev processed' },
  { name: 'agent:processed-by-qa', color: 'FEF2C0', desc: 'QA processed' },
];

labels.forEach(label => {
  try {
    execSync(`gh label create "${label.name}" --color "${label.color}" --description "${label.desc}"`, {
      stdio: 'inherit'
    });
  } catch (error) {
    console.log(`Label ${label.name} might already exist`);
  }
});

console.log('✅ Agent labels setup complete!');
```

Create `scripts/agent-status.js`:

```javascript
const fs = require('fs');
const path = require('path');

const agentsDir = '.agents';

console.log('🤖 Multi-Agent System Status\n');

['work-packages', 'test-scenarios', 'test-reports', 'deployment-reports'].forEach(dir => {
  const fullPath = path.join(agentsDir, dir);

  if (fs.existsSync(fullPath)) {
    const files = fs.readdirSync(fullPath).filter(f => f.endsWith('.json'));
    console.log(`📁 ${dir}: ${files.length} files`);

    if (files.length > 0) {
      const latest = files[files.length - 1];
      const content = JSON.parse(fs.readFileSync(path.join(fullPath, latest), 'utf8'));
      console.log(`   Latest: ${content.id || latest}`);
      console.log(`   Status: ${content.status || content.decision || 'N/A'}\n`);
    }
  }
});
```

---

## 🐛 Troubleshooting

### Agent Not Running

**Check:**
```bash
# Is GitHub Actions enabled?
gh api repos/:owner/:repo/actions/permissions

# Are workflows present?
ls .github/workflows/

# View recent runs
gh run list
```

### View Logs

```bash
# View latest workflow run
gh run view

# View specific job
gh run view --job <job-id>

# Download logs
gh run download <run-id>
```

### Manual Trigger

```bash
# Manually trigger workflow (if configured)
gh workflow run agent-pipeline.yml
```

---

## 📊 Monitoring

### Dashboard View

Create a simple dashboard:

```bash
# In terminal, run:
watch -n 5 'npm run agents:status'
```

### GitHub Actions Badge

Add to README.md:

```markdown
[![Agent Pipeline](https://github.com/YOUR_USERNAME/CMMS/actions/workflows/agent-pipeline.yml/badge.svg)](https://github.com/YOUR_USERNAME/CMMS/actions/workflows/agent-pipeline.yml)
```

---

## 💡 Tips

1. **Start Small:** Test with simple features first
2. **Use Manual Mode:** Learn agent behavior with slash commands
3. **Review Artifacts:** Check JSON files to understand agent thinking
4. **Iterate:** Agents improve with clear requirements
5. **Monitor:** Watch GitHub Actions for automated flows

---

## 📚 Next Steps

1. ✅ Setup labels
2. ✅ Test with simple feature
3. ✅ Review agent outputs
4. ✅ Customize agent prompts
5. ✅ Add more automation

---

## 🆘 Need Help?

- Read: `MULTI_AGENT_SYSTEM.md` for detailed docs
- Check: `.claude/commands/agent-*.md` for agent configs
- View: `.github/workflows/agent-pipeline.yml` for pipeline
- Run: `/agent-pm` and ask questions!

---

**Happy building with your AI agent team! 🚀**
