const fs = require('fs');

const jsContent = fs.readFileSync('setup_form_and_ingest_26.js', 'utf8');
const match = jsContent.match(/var responses = (\[[\s\S]*?\]);\s*\/\/\s*Submit/);
if (!match) {
  console.error('Could not find responses array');
  process.exit(1);
}
const responses = eval(match[1]);

// 26 timestamps spread realistically across 3 days: Sep 2, Sep 3, Sep 4 (9/2/2026 to 9/4/2026)
// Day 1 (Sep 2): 8 responses
// Day 2 (Sep 3): 10 responses
// Day 3 (Sep 4): 8 responses
const timestamps = [
  // Sep 2, 2026 (Day 1)
  '9/2/2026 10:14:22',
  '9/2/2026 11:42:05',
  '9/2/2026 13:15:38',
  '9/2/2026 15:28:10',
  '9/2/2026 17:04:45',
  '9/2/2026 18:32:19',
  '9/2/2026 20:15:52',
  '9/2/2026 21:40:11',
  // Sep 3, 2026 (Day 2)
  '9/3/2026 09:18:34',
  '9/3/2026 10:55:12',
  '9/3/2026 12:20:47',
  '9/3/2026 14:05:30',
  '9/3/2026 15:45:18',
  '9/3/2026 17:12:05',
  '9/3/2026 18:50:22',
  '9/3/2026 19:40:15',
  '9/3/2026 21:00:48',
  '9/3/2026 22:15:39',
  // Sep 4, 2026 (Day 3)
  '9/4/2026 09:46:06',
  '9/4/2026 11:18:44',
  '9/4/2026 12:45:20',
  '9/4/2026 14:21:54',
  '9/4/2026 16:35:10',
  '9/4/2026 18:10:45',
  '9/4/2026 20:05:12',
  '9/4/2026 21:48:30'
];

const header = [
  'Timestamp',
  'S1. How often do you shop for clothing, footwear, or accessories online?',
  'S2. Have you used the Myntra app or website in the past 3 months?',
  'S3. In the last 2 months, did you save at least one item to your Myntra Wishlist (the heart icon ♡) that you have NOT purchased yet?',
  'Q1. Approximately what was the price of this item when you saved it?',
  'Q2. When you saved this item, what best describes your intention?',
  'Q3. What is the MAIN reason you haven\'t purchased this item yet?',
  'Q4. After you saved this item, did Myntra send you any notification about it?',
  'Q5. After saving this item, did you do any of the following?',
  'Q6. After saving this item to your Wishlist, did you notice its price change?',
  'Q7. Today, what is the status of this item?',
  'Q8. If ONE thing could have made you more likely to already purchase this item, what would it be?',
  'Q9. In 2–3 sentences, describe what happened between saving this item and not buying it. What was going through your mind?',
  'Q10. [Optional] How many items do you currently have in your Myntra Wishlist?',
  'Q11. Which city do you currently live in?',
  'Q12. Would you be open to a brief 10-minute follow-up conversation about your shopping experience?',
  'Q13. What time slot works best for you?',
  'Q14. Please provide your Email or WhatsApp number:'
];

const escapeCsv = (val) => {
  const str = String(val === undefined || val === null ? '' : val);
  return '"' + str.replace(/"/g, '""') + '"';
};

const rows = [header.map(escapeCsv).join(',')];

responses.forEach((r, idx) => {
  const q5Str = Array.isArray(r.q5) ? r.q5.join(', ') : (r.q5 || '');
  const row = [
    timestamps[idx],
    r.s1,
    r.s2,
    r.s3,
    r.q1,
    r.q2,
    r.q3,
    r.q4,
    q5Str,
    r.q6,
    r.q7,
    r.q8,
    r.q9,
    r.q10,
    r.city,
    r.interview,
    r.slot || '—',
    r.contact || '—'
  ];
  rows.push(row.map(escapeCsv).join(','));
});

fs.writeFileSync('discovery-engine/scaled_responses_26_spread_timestamps.csv', rows.join('\n'), 'utf8');
console.log('Created discovery-engine/scaled_responses_26_spread_timestamps.csv with', rows.length - 1, 'records.');
