#!/usr/bin/env node
/**
 * Test the Multi-Agent workflow with a sample feature
 * Run: node scripts/test-agent-workflow.js
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Multi-Agent Workflow');
console.log('═══════════════════════════════════════════════════════\n');

// Ensure directories exist
const dirs = [
  '.agents/work-packages',
  '.agents/test-scenarios',
  '.agents/test-reports',
  '.agents/deployment-reports',
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created: ${dir}`);
  }
});

console.log('\n📝 Creating sample workflow...\n');

// 1. PM Agent - Create Work Package
const wpTimestamp = Date.now();
const wpId = `WP-${wpTimestamp}`;

const workPackage = {
  id: wpId,
  issueNumber: 999,
  title: 'Test: Add health check endpoint',
  description: 'Add a GET /api/health endpoint that returns system status',
  requirements: [
    'Create GET /api/health endpoint',
    'Return 200 OK with system status',
    'Include database connection status',
    'Include timestamp',
  ],
  acceptanceCriteria: [
    'Endpoint returns 200 status code',
    'Response includes status: "ok"',
    'Response includes database status',
    'Response includes timestamp',
  ],
  affectedFiles: [
    'backend/src/routes/health.routes.ts',
    'backend/src/controllers/health.controller.ts',
  ],
  priority: 'low',
  estimatedComplexity: 'simple',
  createdAt: new Date().toISOString(),
  status: 'ready-for-dev',
  nextAgent: 'developer',
};

fs.writeFileSync(
  path.join('.agents/work-packages', `${wpId}.json`),
  JSON.stringify(workPackage, null, 2)
);

console.log('🔍 PM Agent: Work package created');
console.log(`   ID: ${wpId}`);
console.log(`   Status: ${workPackage.status}`);
console.log(`   Next: ${workPackage.nextAgent}`);

// 2. Developer Agent - Create Test Scenarios
const tsTimestamp = Date.now() + 1000;
const tsId = `TS-${tsTimestamp}`;

const testScenarios = {
  id: tsId,
  workPackageId: wpId,
  prNumber: 101,
  title: 'Implement health check endpoint',
  implementedFiles: [
    'backend/src/routes/health.routes.ts',
    'backend/src/controllers/health.controller.ts',
    'backend/src/routes/index.ts',
  ],
  testScenarios: [
    {
      scenario: 'Health check returns success',
      steps: [
        'Send GET request to /api/health',
        'Verify response status is 200',
        'Verify response contains status: ok',
      ],
      expectedResult: '200 OK with health status object',
      edgeCases: [
        'Database connection lost',
        'Server under heavy load',
      ],
    },
  ],
  unitTests: 'backend/src/__tests__/health.test.ts',
  integrationPoints: [
    'Database connection check',
    'System metrics',
  ],
  createdAt: new Date().toISOString(),
  status: 'ready-for-qa',
  nextAgent: 'qa',
};

fs.writeFileSync(
  path.join('.agents/test-scenarios', `${tsId}.json`),
  JSON.stringify(testScenarios, null, 2)
);

console.log('\n👨‍💻 Developer Agent: Test scenarios created');
console.log(`   ID: ${tsId}`);
console.log(`   Work Package: ${wpId}`);
console.log(`   Status: ${testScenarios.status}`);
console.log(`   Next: ${testScenarios.nextAgent}`);

// 3. QA Agent - Create Test Report
const trTimestamp = Date.now() + 2000;
const trId = `TR-${trTimestamp}`;

const testReport = {
  id: trId,
  workPackageId: wpId,
  prNumber: 101,
  testDate: new Date().toISOString(),
  testResults: {
    passed: [
      'Health check endpoint exists',
      'Returns 200 status code',
      'Response includes status field',
      'Response includes database status',
      'Response includes timestamp',
      'Unit tests pass',
    ],
    failed: [],
    warnings: [],
  },
  acceptanceCriteriaStatus: {
    'Endpoint returns 200 status code': '✅ Passed',
    'Response includes status: "ok"': '✅ Passed',
    'Response includes database status': '✅ Passed',
    'Response includes timestamp': '✅ Passed',
  },
  coverageReport: 'Coverage: 95%',
  bugsFound: [],
  recommendations: [
    'Consider adding response time metrics',
    'Add caching headers for the endpoint',
  ],
  decision: 'approved',
  nextAgent: 'devops',
  status: 'ready-for-deploy',
};

fs.writeFileSync(
  path.join('.agents/test-reports', `${trId}.json`),
  JSON.stringify(testReport, null, 2)
);

console.log('\n🧪 QA Agent: Test report created');
console.log(`   ID: ${trId}`);
console.log(`   Work Package: ${wpId}`);
console.log(`   Decision: ${testReport.decision}`);
console.log(`   Status: ${testReport.status}`);
console.log(`   Next: ${testReport.nextAgent}`);

// 4. DevOps Agent - Create Deployment Report
const drTimestamp = Date.now() + 3000;
const drId = `DR-${drTimestamp}`;

const deploymentReport = {
  id: drId,
  workPackageId: wpId,
  branch: 'main',
  commit: 'abc123def456',
  deploymentDate: new Date().toISOString(),
  environment: 'production',
  deployedServices: [
    'backend:1.3.0',
  ],
  dockerImages: [
    'cmms-backend:1.3.0',
  ],
  databaseMigrations: [],
  configChanges: [
    'Added /api/health endpoint to nginx config',
  ],
  smokeTestResults: {
    'Backend health check': '✅ Pass',
    'Database connection': '✅ Pass',
    'API responsiveness': '✅ Pass',
  },
  rollbackPlan: 'Revert to version 1.2.0 if issues detected',
  status: 'success',
  nextSteps: [
    'Monitor health endpoint metrics',
    'Update monitoring dashboard',
  ],
  completedWorkPackage: true,
};

fs.writeFileSync(
  path.join('.agents/deployment-reports', `${drId}.json`),
  JSON.stringify(deploymentReport, null, 2)
);

console.log('\n🚀 DevOps Agent: Deployment report created');
console.log(`   ID: ${drId}`);
console.log(`   Work Package: ${wpId}`);
console.log(`   Environment: ${deploymentReport.environment}`);
console.log(`   Status: ${deploymentReport.status}`);
console.log(`   Completed: ${deploymentReport.completedWorkPackage}`);

console.log('\n═══════════════════════════════════════════════════════');
console.log('✅ Test workflow completed successfully!');
console.log('\n📊 Workflow Summary:');
console.log(`   1. PM Agent created work package: ${wpId}`);
console.log(`   2. Developer created test scenarios: ${tsId}`);
console.log(`   3. QA Agent created test report: ${trId}`);
console.log(`   4. DevOps Agent created deployment report: ${drId}`);
console.log('\n💡 View results:');
console.log('   Run: node scripts/agent-status.js');
console.log('   Or check: .agents/ directory');
