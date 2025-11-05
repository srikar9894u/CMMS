#!/usr/bin/env node
/**
 * Display Multi-Agent System status
 * Run: node scripts/agent-status.js
 */

const fs = require('fs');
const path = require('path');

const agentsDir = '.agents';

console.log('🤖 Multi-Agent CI/CD System Status');
console.log('═══════════════════════════════════════════════════════\n');

const directories = [
  { name: 'work-packages', agent: 'PM Agent', icon: '🔍' },
  { name: 'test-scenarios', agent: 'Developer Agent', icon: '👨‍💻' },
  { name: 'test-reports', agent: 'QA Agent', icon: '🧪' },
  { name: 'deployment-reports', agent: 'DevOps Agent', icon: '🚀' },
];

let totalFiles = 0;

directories.forEach(dir => {
  const fullPath = path.join(agentsDir, dir.name);

  console.log(`${dir.icon} ${dir.agent} (${dir.name})`);
  console.log('─────────────────────────────────────────────────────');

  if (!fs.existsSync(fullPath)) {
    console.log('   Status: Directory not found (will be created on first use)');
    console.log('');
    return;
  }

  const files = fs.readdirSync(fullPath).filter(f => f.endsWith('.json'));
  totalFiles += files.length;

  if (files.length === 0) {
    console.log('   Status: No artifacts yet');
    console.log('');
    return;
  }

  console.log(`   Total artifacts: ${files.length}`);

  // Show latest file
  const latest = files.sort().reverse()[0];
  const latestPath = path.join(fullPath, latest);

  try {
    const content = JSON.parse(fs.readFileSync(latestPath, 'utf8'));

    console.log(`   Latest: ${content.id || latest}`);

    if (content.title) {
      console.log(`   Title: ${content.title.substring(0, 50)}${content.title.length > 50 ? '...' : ''}`);
    }

    if (content.status) {
      console.log(`   Status: ${content.status}`);
    }

    if (content.decision) {
      console.log(`   Decision: ${content.decision}`);
    }

    if (content.nextAgent) {
      console.log(`   Next Agent: ${content.nextAgent}`);
    }

    if (content.createdAt || content.testDate || content.deploymentDate) {
      const date = content.createdAt || content.testDate || content.deploymentDate;
      console.log(`   Date: ${new Date(date).toLocaleString()}`);
    }

  } catch (error) {
    console.log(`   Latest: ${latest} (could not parse)`);
  }

  console.log('');
});

console.log('═══════════════════════════════════════════════════════');
console.log(`📊 Total artifacts: ${totalFiles}`);

if (totalFiles === 0) {
  console.log('\n💡 No agent activity yet. To get started:');
  console.log('   1. Create a GitHub issue (triggers PM Agent)');
  console.log('   2. Or run /agent-pm in Claude Code');
  console.log('   3. Read AGENT_QUICK_START.md for more info');
} else {
  console.log('\n✅ Multi-Agent System is active!');
}
