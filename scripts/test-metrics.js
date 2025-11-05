#!/usr/bin/env node

/**
 * Test Metrics Tracker
 * Analyzes Playwright test results and tracks pass rates over time
 */

const fs = require('fs');
const path = require('path');

const RESULTS_FILE = path.join(__dirname, '../test-reports/results.json');
const METRICS_FILE = path.join(__dirname, '../test-reports/metrics-history.json');

function loadResults() {
  try {
    if (!fs.existsSync(RESULTS_FILE)) {
      console.error('❌ No test results found at:', RESULTS_FILE);
      process.exit(1);
    }

    const data = fs.readFileSync(RESULTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Error loading test results:', error.message);
    process.exit(1);
  }
}

function loadMetricsHistory() {
  try {
    if (!fs.existsSync(METRICS_FILE)) {
      return { runs: [] };
    }

    const data = fs.readFileSync(METRICS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.warn('⚠️  Could not load metrics history:', error.message);
    return { runs: [] };
  }
}

function analyzeResults(results) {
  const stats = {
    timestamp: new Date().toISOString(),
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    duration: 0,
    byBrowser: {},
    bySuite: {}
  };

  // Analyze test results
  results.suites.forEach(suite => {
    const suiteName = suite.title || 'Unknown';

    suite.specs.forEach(spec => {
      spec.tests.forEach(test => {
        stats.total++;

        const browser = test.projectName || 'unknown';

        // Initialize browser stats
        if (!stats.byBrowser[browser]) {
          stats.byBrowser[browser] = { total: 0, passed: 0, failed: 0, skipped: 0 };
        }

        // Initialize suite stats
        if (!stats.bySuite[suiteName]) {
          stats.bySuite[suiteName] = { total: 0, passed: 0, failed: 0, skipped: 0 };
        }

        // Update counts
        const status = test.status;
        if (status === 'expected' || status === 'passed') {
          stats.passed++;
          stats.byBrowser[browser].passed++;
          stats.bySuite[suiteName].passed++;
        } else if (status === 'skipped') {
          stats.skipped++;
          stats.byBrowser[browser].skipped++;
          stats.bySuite[suiteName].skipped++;
        } else {
          stats.failed++;
          stats.byBrowser[browser].failed++;
          stats.bySuite[suiteName].failed++;
        }

        stats.byBrowser[browser].total++;
        stats.bySuite[suiteName].total++;

        // Add duration
        if (test.results && test.results[0]) {
          stats.duration += test.results[0].duration || 0;
        }
      });
    });
  });

  // Calculate pass rate
  stats.passRate = stats.total > 0 ? (stats.passed / stats.total * 100).toFixed(2) : 0;
  stats.duration = (stats.duration / 1000).toFixed(2); // Convert to seconds

  return stats;
}

function saveMetrics(stats) {
  try {
    const history = loadMetricsHistory();

    // Add current run to history
    history.runs.push(stats);

    // Keep only last 100 runs
    if (history.runs.length > 100) {
      history.runs = history.runs.slice(-100);
    }

    // Calculate trends
    if (history.runs.length > 1) {
      const previousRun = history.runs[history.runs.length - 2];
      stats.trend = {
        passRateChange: (stats.passRate - previousRun.passRate).toFixed(2),
        failedChange: stats.failed - previousRun.failed
      };
    }

    // Save updated history
    const dir = path.dirname(METRICS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(METRICS_FILE, JSON.stringify(history, null, 2));
    console.log('✅ Metrics saved to:', METRICS_FILE);

  } catch (error) {
    console.error('❌ Error saving metrics:', error.message);
  }
}

function displayMetrics(stats) {
  console.log('\n📊 Test Metrics Summary');
  console.log('═'.repeat(60));
  console.log(`📅 Timestamp: ${stats.timestamp}`);
  console.log(`📋 Total Tests: ${stats.total}`);
  console.log(`✅ Passed: ${stats.passed} (${stats.passRate}%)`);
  console.log(`❌ Failed: ${stats.failed}`);
  console.log(`⏭️  Skipped: ${stats.skipped}`);
  console.log(`⏱️  Duration: ${stats.duration}s`);

  if (stats.trend) {
    console.log('\n📈 Trend');
    console.log('─'.repeat(60));
    const trendSymbol = stats.trend.passRateChange >= 0 ? '📈' : '📉';
    console.log(`${trendSymbol} Pass Rate Change: ${stats.trend.passRateChange}%`);
    console.log(`🔢 Failed Change: ${stats.trend.failedChange > 0 ? '+' : ''}${stats.trend.failedChange}`);
  }

  console.log('\n🌐 By Browser');
  console.log('─'.repeat(60));
  Object.entries(stats.byBrowser).forEach(([browser, data]) => {
    const passRate = (data.passed / data.total * 100).toFixed(1);
    console.log(`${browser.padEnd(15)} ${data.passed}/${data.total} (${passRate}%)`);
  });

  console.log('\n📦 By Test Suite');
  console.log('─'.repeat(60));
  Object.entries(stats.bySuite).forEach(([suite, data]) => {
    const passRate = (data.passed / data.total * 100).toFixed(1);
    console.log(`${suite.padEnd(25)} ${data.passed}/${data.total} (${passRate}%)`);
  });

  console.log('═'.repeat(60));

  // Status
  if (stats.passRate >= 95) {
    console.log('🎉 Status: EXCELLENT');
  } else if (stats.passRate >= 90) {
    console.log('✅ Status: GOOD');
  } else if (stats.passRate >= 80) {
    console.log('⚠️  Status: NEEDS ATTENTION');
  } else {
    console.log('❌ Status: CRITICAL');
  }

  console.log('');
}

function main() {
  console.log('🔍 Analyzing test results...\n');

  const results = loadResults();
  const stats = analyzeResults(results);

  displayMetrics(stats);
  saveMetrics(stats);
}

main();
