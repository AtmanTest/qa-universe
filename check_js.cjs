const fs = require('fs');
const html = fs.readFileSync('/Users/jahangir/qa-universe/index.html', 'utf8');
// Find the LAST script tag (the main one)
const scriptStart = html.lastIndexOf('<script>');
const scriptEnd = html.lastIndexOf('</script>');
if (scriptStart === -1 || scriptEnd === -1) {
  console.log('Script tags not found');
  process.exit(1);
}
const js = html.substring(scriptStart + 8, scriptEnd);
console.log('JS length:', js.length, 'chars');
console.log('Script tag position:', scriptStart, '-', scriptEnd);

// Check for syntax errors by compiling to AST-like check
try {
  eval('(function(){\n' + js + '\n})');
  console.log('✅ SYNTAX VALID');
} catch(e) {
  console.log('❌', e.message);
  // Find the error line approximately
  const lines = js.split('\n');
  console.log('Total lines:', lines.length);
  // Check each line for possible issues
  for (let i = 0; i < Math.min(lines.length, 20); i++) {
    console.log((i+1) + ': ' + lines[i].substring(0, 160));
  }
}
