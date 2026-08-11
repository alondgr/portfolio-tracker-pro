const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src/app/api');
let updatedCount = 0;
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  
  if (content.match(/import\s+\{\s*auth\s*\}\s+from\s+'@clerk\/nextjs';/)) {
    content = content.replace(/import\s+\{\s*auth\s*\}\s+from\s+'@clerk\/nextjs';/g, "import { auth } from '@clerk/nextjs/server';");
    changed = true;
  }
  
  if (content.match(/const\s+\{\s*userId\s*\}\s*=\s*auth\(\);/)) {
    content = content.replace(/const\s+\{\s*userId\s*\}\s*=\s*auth\(\);/g, "const { userId } = await auth();");
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(file, content);
    console.log('Updated ' + file);
    updatedCount++;
  }
});
console.log('Total files updated: ' + updatedCount);
