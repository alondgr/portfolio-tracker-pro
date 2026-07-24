const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'src');

const PATTERNS = {
  hardcodedKeys: {
    regex: /(sk_test_[a-zA-Z0-9]+|sk_live_[a-zA-Z0-9]+)/g,
    message: 'Potential hardcoded Stripe/API key found.'
  },
  stringSortTrap: {
    // Looks for .sort() without arguments which can cause unexpected string-based sorting
    regex: /\.sort\(\s*\)/g,
    message: 'Array.sort() called without a comparator. This sorts alphabetically, which can break for numbers.'
  },
  redundantState: {
    // Heuristic: Looking for state that looks like it might be derived, e.g. "filteredItems" or "totalSomething"
    regex: /useState\(.*?filtered.*?\)|useState\(.*?total.*?\)/gi,
    message: 'Potential redundant state detected (e.g., storing filtered/total results in state instead of deriving it).'
  }
};

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function runCodeReview() {
  console.log('Running codebase review...');
  const findings = [];

  walkDir(SRC_DIR, (filePath) => {
    // Only scan js, jsx, ts, tsx
    if (!/\.(js|jsx|ts|tsx)$/.test(filePath)) return;

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      for (const [key, rule] of Object.entries(PATTERNS)) {
        if (rule.regex.test(line)) {
          findings.push({
            file: filePath.replace(path.join(__dirname, '..'), ''),
            line: index + 1,
            rule: key,
            message: rule.message,
            snippet: line.trim().substring(0, 80)
          });
        }
        // Reset lastIndex for global regexes
        rule.regex.lastIndex = 0;
      }
    });
  });

  return findings;
}

// If run directly
if (require.main === module) {
  const findings = runCodeReview();
  if (findings.length === 0) {
    console.log('✅ Codebase review passed with no findings.');
  } else {
    console.log(`⚠️ Found ${findings.length} potential issues:\n`);
    findings.forEach(f => {
      console.log(`[${f.rule}] ${f.file}:${f.line}`);
      console.log(`   ${f.message}`);
      console.log(`   > ${f.snippet}`);
      console.log();
    });
  }
}

module.exports = { runCodeReview };
