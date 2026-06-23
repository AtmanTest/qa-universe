const fs = require('fs');
const html = fs.readFileSync('/Users/jahangir/qa-universe/index.html', 'utf8');
const scriptStart = html.indexOf('<script>') + 8;
const scriptEnd = html.lastIndexOf('</script>');
const js = html.substring(scriptStart, scriptEnd);

// Find unescaped single quotes in single-quoted strings in the TD data section
// by looking at the data after the original script ends (after renderTools, renderTrain, etc.)
const dataStart = js.indexOf('// ===== TOOL DETAIL DATA =====');
const dataSection = js.substring(dataStart);

// Find all problematic single quotes (apostrophes in French text)
const problematic = [];
let inSQ = false;
let inDQ = false;
let inBT = false;
let braceDepth = 0;
let lineNum = 0;

for (let i = 0; i < dataSection.length; i++) {
  const ch = dataSection[i];
  const prev = i > 0 ? dataSection[i-1] : '';
  const next = i < dataSection.length - 1 ? dataSection[i+1] : '';
  
  if (ch === '\n') lineNum++;
  
  if (!inSQ && !inDQ && !inBT) {
    if (ch === "'" && prev !== '\\') { inSQ = true; braceDepth = 0; }
    else if (ch === '"' && prev !== '\\') { inDQ = true; }
    else if (ch === '`' && prev !== '\\') { inBT = true; }
  } else if (inSQ) {
    if (ch === "'" && prev !== '\\') { 
      inSQ = false; 
    }
    // Check for potential apostrophe inside (single quote with letter after)
    if (ch === "'" && prev !== '\\' && /[a-zA-ZÀ-ÿ]/.test(next) && lineNum > 750) {
      const ctxStart = Math.max(0, i-40);
      const ctxEnd = Math.min(dataSection.length, i+40);
      problematic.push({
        line: lineNum,
        context: dataSection.substring(ctxStart, ctxEnd).replace(/\n/g, ' ')
      });
    }
  } else if (inDQ) {
    if (ch === '"' && prev !== '\\') { inDQ = false; }
  } else if (inBT) {
    if (ch === '`' && prev !== '\\') { inBT = false; }
    else if (ch === '$' && next === '{') { 
      // Skip past ${}
      i += 1; // skip the {
      // Track ${} by scanning for balanced braces
      let depth = 1;
      while (i < dataSection.length && depth > 0) {
        i++;
        const c = dataSection[i];
        if (c === '{') depth++;
        else if (c === '}') depth--;
      }
    }
  }
}

for (const p of problematic) {
  console.log(`Line ~${p.line}: ${p.context.substring(0, 120)}`);
}
