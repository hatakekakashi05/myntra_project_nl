const fs = require('fs');

function parseCSV(text) {
  const p = [];
  let row = [''];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i+1];
    if (c === '"' && inQuotes && next === '"') {
      row[row.length - 1] += '"';
      i++;
    } else if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      row.push('');
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && next === '\n') { i++; }
      p.push(row);
      row = [''];
    } else {
      row[row.length - 1] += c;
    }
  }
  if (row.length > 1 || row[0] !== '') p.push(row);
  return p;
}

const fileContent = fs.readFileSync('discovery-engine/scaled_responses_26_spread_timestamps.csv', 'utf8').trim();
const allData = parseCSV(fileContent);
const headers = allData[0];
const records = allData.slice(1);

console.log('Total valid records:', records.length);

function getDistribution(colIdx, name) {
  const counts = {};
  records.forEach(r => {
    const val = r[colIdx] ? r[colIdx].trim() : 'Blank';
    counts[val] = (counts[val] || 0) + 1;
  });
  console.log(`\n=== ${name} (N=${records.length}) ===`);
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  sorted.forEach(([k, v]) => {
    const pct = ((v / records.length) * 100).toFixed(1);
    console.log(`- ${k}: ${v} (${pct}%)`);
  });
  return sorted;
}

getDistribution(6, 'Q3. MAIN REASON (BLOCKER)');
getDistribution(4, 'Q1. PRICE POINT');
getDistribution(5, 'Q2. INTENTION AT SAVING');
getDistribution(7, 'Q4. NOTIFICATIONS RECEIVED');
getDistribution(9, 'Q6. PRICE CHANGE NOTICED');
getDistribution(10, 'Q7. CURRENT STATUS');
getDistribution(11, 'Q8. ONE THING THAT WOULD HELP');
getDistribution(13, 'Q10. WISHLIST SIZE');
getDistribution(14, 'Q11. CITY');
getDistribution(15, 'Q12. INTERVIEW CONSENT');

console.log('\n=== INTERVIEW CANDIDATES (N=5) ===');
records.forEach((r, idx) => {
  if (r[15] && r[15].trim() === 'Yes') {
    console.log(`Candidate ${idx+1}: City=${r[14]}, Slot=${r[16]}, Contact=${r[17]}, MainReason=${r[6]}, Price=${r[4]}, Verbatim="${r[12]}"`);
  }
});
