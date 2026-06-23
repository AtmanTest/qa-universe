const fs = require('fs');
const html = fs.readFileSync('/Users/jahangir/qa-universe/index.html', 'utf8');
const scriptStart = html.indexOf('<script>') + 8;
const scriptEnd = html.lastIndexOf('</script>');
const js = html.substring(scriptStart, scriptEnd);

console.log('Attempting full parse...');
let err;
try {
  // Use Indirect eval to get better error info
  const f = new Function(js);
  console.log('✅ JS VALID');
} catch(e) {
  console.log('❌', e.message);
  err = e;
  
  // If we have line info
  if (e.lineNumber) {
    const lines = js.split('\n');
    const start = Math.max(0, e.lineNumber - 3);
    const end = Math.min(lines.length, e.lineNumber + 2);
    for (let i = start; i < end; i++) {
      console.log((i+1) + ': ' + lines[i].substring(0, 200));
    }
  } else {
    // No line info - check if issue is quotes/backticks
    // Walk through and check string boundaries
    let quote = null;
    let backtick = null;
    let lineNum = 1;
    for (let i = 0; i < js.length; i++) {
      const ch = js[i];
      const prev = i > 0 ? js[i-1] : '';
      
      if (ch === '\n') lineNum++;
      
      if (!quote && !backtick) {
        // Not in a string
        if (ch === "'" && prev !== '\\') quote = "'";
        else if (ch === '"' && prev !== '\\') quote = '"';
        else if (ch === '`' && prev !== '\\') backtick = true;
      } else if (quote) {
        if (ch === quote && prev !== '\\') quote = null;
      } else if (backtick) {
        if (ch === '`' && prev !== '\\') backtick = false;
        // Track template literal nesting for ${}
      }
    }
    console.log('At end: inString=' + !!quote + ' inBacktick=' + !!backtick);
    if (quote) console.log('Unclosed ' + quote + ' quote');
    if (backtick) console.log('Unclosed backtick');
  }
}
