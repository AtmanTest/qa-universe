const fs = require('fs');
const html = fs.readFileSync('/Users/jahangir/qa-universe/index.html', 'utf8');
const scriptStart = html.indexOf('<script>') + 8;
const scriptEnd = html.lastIndexOf('</script>');
const js = html.substring(scriptStart, scriptEnd);

// Track unclosed single quote
let quote = null;
let backtick = false;
let lineNum = 1;
let lastQuoteLine = 0;
let lastQuoteContext = '';

for (let i = 0; i < js.length; i++) {
  const ch = js[i];
  const prev = i > 0 ? js[i-1] : '';
  
  if (ch === '\n') lineNum++;
  
  if (!quote && !backtick) {
    // Not in any string
    if (ch === "'" && prev !== '\\') { 
      quote = "'"; 
      lastQuoteLine = lineNum; 
      const ctxStart = Math.max(0, i-30);
      const ctxEnd = Math.min(js.length, i+60);
      lastQuoteContext = js.substring(ctxStart, ctxEnd).replace(/\n/g, '\\n');
    }
    else if (ch === '"' && prev !== '\\') quote = '"';
    else if (ch === '`' && prev !== '\\') backtick = true;
  } else if (quote) {
    if (ch === quote && prev !== '\\') quote = null;
  } else if (backtick) {
    if (ch === '`' && prev !== '\\') {
      backtick = false;
    }
    // Track template literal ${} nesting
    // This is a simplified version
  }
}

console.log('Line of last unclosed single quote:', lastQuoteLine);
console.log('Last quote entered (depth/opening):');
console.log('Context: ...' + lastQuoteContext.substring(lastQuoteContext.length-120));
