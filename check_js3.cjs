const fs = require('fs');
const html = fs.readFileSync('/Users/jahangir/qa-universe/index.html', 'utf8');
const scriptStart = html.indexOf('<script>') + 8;
const scriptEnd = html.lastIndexOf('</script>');
const js = html.substring(scriptStart, scriptEnd);

// Write first 10k chars to file for inspection
fs.writeFileSync('/tmp/js_first_10k.txt', js.substring(0, 10000));
console.log('Wrote first 10K chars. Counting braces...');

// Count braces in first 10K chars
let opens = 0, closes = 0;
for (const ch of js.substring(0, 10000)) {
  if (ch === '{') opens++;
  if (ch === '}') closes++;
}
console.log('{', opens, '}');
console.log('Net:', opens - closes);

// Also try 5000
for (const ch of js.substring(0, 5000)) {
  // count in 5000
}
let o=0,c=0;
for (const ch of js.substring(0, 5000)) {
  if (ch === '{') o++;
  if (ch === '}') c++;
}
console.log('First 5K: {', o, '}, }', c, ', net:', o-c);

// Check 5000-6000
o=0; c=0;
for (const ch of js.substring(5000, 6000)) {
  if (ch === '{') o++;
  if (ch === '}') c++;
}
console.log('5K-6K: {', o, '}, }', c);
