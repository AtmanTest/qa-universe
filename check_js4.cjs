const fs = require('fs');
const html = fs.readFileSync('/Users/jahangir/qa-universe/index.html', 'utf8');
const scriptStart = html.indexOf('<script>') + 8;
const scriptEnd = html.lastIndexOf('</script>');
const js = html.substring(scriptStart, scriptEnd);

// Use a more robust approach - try esprima-style parsing
// Just scan the file for invalid characters
const first2k = js.substring(0, 2000);
for (let i = 0; i < first2k.length; i++) {
  const code = first2k.charCodeAt(i);
  // Check for control chars (except tab, newline, carriage return)
  if (code < 32 && code !== 9 && code !== 10 && code !== 13) {
    console.log(`Control char at position ${i}: code ${code}, hex 0x${code.toString(16)}`);
    console.log(`Context: "${first2k.substring(Math.max(0,i-20), i+20)}"`);
  }
  // Check for special Unicode
  if (code > 127 && (code < 0x2000 || code > 0x206F) && (code < 0xFE00 || code > 0xFE0F) && (code < 0xE0000)) {
    // Normal unicode (letters, emojis) - fine, skip
  }
}

// Try to use dynamic require of acorn
try {
  // Check by evaluating incrementally
  // Let's try the I18N object only
  const iEnd = js.indexOf('\n};', 0);
  if (iEnd > 0) {
    const iPart = js.substring(0, iEnd + 3);
    try {
      new Function(iPart);
      console.log('I object: ✅ OK');
    } catch(e) {
      console.log('I object: ❌', e.message);
    }
  }
} catch(e) {
  console.log('Error:', e.message);
}
