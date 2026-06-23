const fs = require('fs');
const html = fs.readFileSync('/Users/jahangir/qa-universe/index.html', 'utf8');

// Fix line 1492: replace the double-escaped version with correct single escape
const lines = html.split('\n');
const target = 1491; // 0-indexed
console.log('Before:', lines[target].substring(0, 100));

// Replace the problematic content
lines[target] = lines[target].replace(
  "press(\\\\'Enter\\\\')"
).replace(
  "press(\\\\'Enter\\\\')",
  "press(\\'Enter\\')"
);

// Actually, we need to fix the backslash escaping
// The file has \' which became \\' in the patch

// Let me just do it character by character
const line = lines[target];
let fixed = '';
for (let i = 0; i < line.length; i++) {
  // Skip duplicate backslashes before quotes in the c: value
  const next4 = line.substring(i, i+4);
  if (next4 === "\\\\'" && line.substring(i-1, i) !== ':' && line.substring(i+4, i+5) === 'E') {
    fixed += "\\'";
    i += 3;
    continue;
  }
  fixed += line[i];
}

lines[target] = fixed;
console.log('After:', lines[target].substring(0, 100));

fs.writeFileSync('/Users/jahangir/qa-universe/index.html', lines.join('\n'));
console.log('Written');
