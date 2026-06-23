const vm = require('vm');
const fs = require('fs');
const html = fs.readFileSync('/Users/jahangir/qa-universe/index.html', 'utf8');
const scriptStart = html.indexOf('<script>') + 8;
const scriptEnd = html.lastIndexOf('</script>');
const js = html.substring(scriptStart, scriptEnd);

try {
  vm.compileFunction(js, [], { parsingContext: {} });
  console.log('✅ JS VALID');
} catch(e) {
  console.log('❌', e.message);
  if (e.stack) {
    const lines = e.stack.split('\n');
    for (const l of lines) {
      if (l.includes('eval') || l.includes('Function')) {
        console.log(l.substring(0, 200));
      }
    }
  }
  // Show character position
  console.log('Character position info not available from this error');
}
