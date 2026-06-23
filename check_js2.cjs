const fs = require('fs');
const html = fs.readFileSync('/Users/jahangir/qa-universe/index.html', 'utf8');

// Extract the script content
const scriptStart = html.indexOf('<script>') + 8;
const scriptEnd = html.lastIndexOf('</script>');
const js = html.substring(scriptStart, scriptEnd);

// Find the exact error using incremental eval
const lines = js.split('\n');

// Try to identify the problematic area
// Scan for unescaped single quotes that could break string parsing
// Also check for problematic patterns

// Look for the I object ending - find a ';' after 'const I = {'
let braceDepth = 0;
let inString = false;
let stringChar = null;
let i = 0;

// Check for common patterns that break
for (let idx = 0; idx < js.length; idx++) {
  const ch = js[idx];
  const prev = idx > 0 ? js[idx-1] : '';
  
  if (!inString) {
    if ((ch === "'" || ch === '"' || ch === '`') && prev !== '\\') {
      inString = true;
      stringChar = ch;
    }
    if (ch === '{') braceDepth++;
    if (ch === '}') braceDepth--;
  } else {
    if (ch === stringChar && prev !== '\\') {
      inString = false;
      stringChar = null;
    }
  }
}

console.log('Final brace depth:', braceDepth);

// Check for the exact issue by trying to parse incrementally
try {
  new Function(js.substring(0, 10000));
  console.log('First 10K chars: OK');
} catch(e) {
  console.log('Error in first 10K chars:', e.message);
}

try {
  new Function(js.substring(0, 20000));
  console.log('First 20K chars: OK');
} catch(e) {
  console.log('Error in first 20K chars:', e.message);
}

try {
  new Function(js.substring(0, 40000));
  console.log('First 40K chars: OK');
} catch(e) {
  console.log('Error in first 40K chars:', e.message);
}

try {
  new Function(js.substring(0, 80000));
  console.log('First 80K chars: OK');
} catch(e) {
  console.log('Error in first 80K chars:', e.message);
}
