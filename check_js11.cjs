const fs = require('fs');
const html = fs.readFileSync('/Users/jahangir/qa-universe/index.html', 'utf8');
const scriptStart = html.indexOf('<script>') + 8;
const scriptEnd = html.lastIndexOf('</script>');
const js = html.substring(scriptStart, scriptEnd);

// Write to temp file
// Remove certain patterns that could confuse things
// but let's just write the raw JS
fs.writeFileSync('/tmp/qa_tools_js.js', js);
console.log('Written /tmp/qa_tools_js.js');
console.log('Size:', js.length);
