const fs = require('fs');
const html = fs.readFileSync('/Users/jahangir/qa-universe/index.html', 'utf8');
const lines = html.split('\n');

// Find ALL occurrences of "',d':" (the problematic pattern) vs "',d:" (correct)
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes(",d':") && (line.includes("\\'") || line.includes(',d'))) {
    // Check if it has the problematic extra quote
    if (line.includes("',d':")) {
      console.log(`L${i+1} [PROBLEM]: ${line.substring(0, 120)}`);
    } else {
      // console.log(`L${i+1} OK`);
    }
  }
}
