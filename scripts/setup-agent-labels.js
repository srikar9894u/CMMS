#!/usr/bin/env node
/**
 * Setup GitHub labels for Multi-Agent CI/CD System
 * Run: node scripts/setup-agent-labels.js
 */

const { execSync } = require('child_process');

const labels = [
  { name: 'agent:pm-review', color: '0E8A16', desc: 'Trigger PM Agent to analyze' },
  { name: 'agent:ready-for-dev', color: '1D76DB', desc: 'Work package ready for development' },
  { name: 'agent:ready-for-qa', color: 'FBCA04', desc: 'Implementation ready for QA testing' },
  { name: 'agent:ready-for-deploy', color: '5319E7', desc: 'Approved and ready for deployment' },
  { name: 'agent:needs-fixes', color: 'D93F0B', desc: 'Issues found, needs developer fixes' },
  { name: 'agent:processed-by-pm', color: 'C2E0C6', desc: 'PM Agent has processed this' },
  { name: 'agent:processed-by-dev', color: 'BFD4F2', desc: 'Developer Agent has processed this' },
  { name: 'agent:processed-by-qa', color: 'FEF2C0', desc: 'QA Agent has processed this' },
];

console.log('🤖 Setting up Multi-Agent System labels...\n');

let created = 0;
let existed = 0;

labels.forEach(label => {
  try {
    const command = `gh label create "${label.name}" --color "${label.color}" --description "${label.desc}"`;
    execSync(command, { stdio: 'pipe' });
    console.log(`✅ Created: ${label.name}`);
    created++;
  } catch (error) {
    console.log(`ℹ️  Exists: ${label.name}`);
    existed++;
  }
});

console.log('\n📊 Summary:');
console.log(`   Created: ${created}`);
console.log(`   Already existed: ${existed}`);
console.log(`   Total: ${labels.length}`);
console.log('\n✅ Agent labels setup complete!');
console.log('\n💡 Next steps:');
console.log('   1. Create an issue to test PM Agent');
console.log('   2. Or run /agent-pm in Claude Code');
console.log('   3. Read AGENT_QUICK_START.md for more info');
