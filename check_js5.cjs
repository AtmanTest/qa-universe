const fs = require('fs');
const html = fs.readFileSync('/Users/jahangir/qa-universe/index.html', 'utf8');
const scriptStart = html.indexOf('<script>') + 8;
const scriptEnd = html.lastIndexOf('</script>');
const js = html.substring(scriptStart, scriptEnd);

// Binary search for error location
function tryParse(limit) {
  try {
    new Function(js.substring(0, limit) + '\n;');
    return null;
  } catch(e) {
    return e.message;
  }
}

// Find exact error
let lo = 10000; // we know 10K fails
let hi = 8000;  // start smaller
// Let me first find where it starts passing
while (hi < 200000) {
  const err = tryParse(hi);
  if (!err) {
    console.log(`Passes at ${hi}`);
    hi += 2000;
  } else {
    console.log(`Fails at ${hi}: ${err.substring(0, 60)}`);
    // Binary search between prev and hi
    let good = hi - 2000;
    let bad = hi;
    while (bad - good > 50) {
      const mid = Math.floor((good + bad) / 2);
      const e = tryParse(mid);
      if (!e) { good = mid; }
      else { bad = mid; }
    }
    console.log(`Error between chars ${good} and ${bad}`);
    console.log(`Context at ${good}:`);
    console.log(js.substring(good, Math.min(js.length, good + 200)));
    break;
  }
}
