const vm = require('vm');
const fs = require('fs');
const html = fs.readFileSync('/Users/jahangir/qa-universe/index.html', 'utf8');
const scriptStart = html.indexOf('<script>') + 8;
const scriptEnd = html.lastIndexOf('</script>');
const js = html.substring(scriptStart, scriptEnd);

try {
  vm.compileFunction(js, []);
  console.log('✅ JS VALID');
} catch(e) {
  console.log('❌', e.message);
}
