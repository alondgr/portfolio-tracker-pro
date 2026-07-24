const { execSync } = require('child_process');
const yf = require('yahoo-finance2').default;
const fs = require('fs');
const { runCodeReview } = require('./code-review');

async function runDependencyScan() {
  console.log('Running dependency scan...');
  try {
    const output = execSync('npm outdated --json', { encoding: 'utf-8' });
    // If no packages are outdated, it exits 0 and returns empty string or '{}'
    return output.trim() ? JSON.parse(output) : {};
  } catch (error) {
    // npm outdated returns exit code 1 if there are outdated packages
    if (error.stdout) {
      try {
        return JSON.parse(error.stdout);
      } catch (e) {
        console.error('Failed to parse npm outdated output', e);
        return {};
      }
    }
    console.error('Failed to run npm outdated', error);
    return {};
  }
}

async function runApiHealthCheck() {
  console.log('Running API health check...');
  const apiStatus = {
    yahooFinance: { status: 'UNKNOWN', latencyMs: 0, error: null }
  };

  try {
    const start = Date.now();
    // Test a reliable symbol to ensure the API format hasn't shifted and it's responsive
    const result = await yf.quote('AAPL');
    const latency = Date.now() - start;
    
    if (result && result.regularMarketPrice) {
      apiStatus.yahooFinance = { status: 'HEALTHY', latencyMs: latency, error: null };
    } else {
      apiStatus.yahooFinance = { status: 'WARNING', latencyMs: latency, error: 'Response missing expected fields (e.g. regularMarketPrice)' };
    }
  } catch (error) {
    apiStatus.yahooFinance = { status: 'DOWN', latencyMs: 0, error: error.message };
  }

  return apiStatus;
}

async function generateReport(outdatedDeps, apiStatus, codeReviewFindings) {
  let md = '# 🛠 System Maintenance Ticket\n\n';
  md += `*Generated on: ${new Date().toUTCString()}*\n\n`;

  // --- API Health Section ---
  md += '## 🌐 API & External Dependency Health\n';
  const yfStatus = apiStatus.yahooFinance;
  
  const statusEmoji = yfStatus.status === 'HEALTHY' ? '✅' : yfStatus.status === 'WARNING' ? '⚠️' : '❌';
  md += `**Yahoo Finance API:** ${statusEmoji} ${yfStatus.status}\n`;
  if (yfStatus.status === 'HEALTHY') {
    md += `- Latency: ${yfStatus.latencyMs}ms\n`;
  } else {
    md += `- Error/Note: ${yfStatus.error}\n`;
  }
  md += '\n';

  // --- Code Review Section ---
  md += '## 🕵️ Codebase Review Findings\n';
  if (codeReviewFindings.length === 0) {
    md += '✅ Codebase scan passed with zero anomalies.\n\n';
  } else {
    md += `⚠️ Found **${codeReviewFindings.length}** potential issues during static analysis:\n\n`;
    codeReviewFindings.forEach(f => {
      md += `**[${f.rule}]** \`${f.file}:${f.line}\`\n`;
      md += `> ${f.message}\n`;
      md += `> \`${f.snippet}\`\n\n`;
    });
  }

  // --- Dependency Section ---
  md += '## 📦 NPM Dependencies (Outdated)\n';
  const deps = Object.entries(outdatedDeps);
  
  if (deps.length === 0) {
    md += '✅ All dependencies are up to date!\n\n';
  } else {
    md += '| Package | Current | Wanted | Latest | Type |\n';
    md += '|---|---|---|---|---|\n';
    
    deps.forEach(([pkgName, details]) => {
      md += `| \`${pkgName}\` | ${details.current || 'N/A'} | ${details.wanted || 'N/A'} | ${details.latest || 'N/A'} | ${details.type || 'N/A'} |\n`;
    });
    md += '\n> **Action Required**: Review the above packages for breaking changes and update accordingly via `npm update` or manually bumping the versions in `package.json`.\n\n';
  }
  
  // --- Next Steps ---
  md += '## 🔧 Recommended Actions\n';
  md += '- [ ] Review and test any major version bumps locally.\n';
  md += '- [ ] Monitor API latency if consistently above 1000ms.\n';
  md += '- [ ] Address flagged codebase smells (if any).\n';

  return md;
}

async function main() {
  const outdatedDeps = await runDependencyScan();
  const apiStatus = await runApiHealthCheck();
  const codeReviewFindings = runCodeReview();
  
  const reportContent = await generateReport(outdatedDeps, apiStatus, codeReviewFindings);
  
  console.log('--- GENERATED REPORT ---');
  console.log(reportContent);
  
  // Write to a file so GitHub Actions can pick it up
  fs.writeFileSync('maintenance-report.md', reportContent);
  console.log('Report saved to maintenance-report.md');
}

main().catch(console.error);
