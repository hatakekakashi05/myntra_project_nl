import fs from "fs";

const data = JSON.parse(fs.readFileSync("scaled_responses_23.json", "utf8"));

// TSV for easy copy-paste into Google Sheets
const headers = [
  "Timestamp",
  "S1. How often do you shop for clothing, footwear, or accessories online?",
  "S2. Have you used the Myntra app or website in the past 3 months?",
  "S3. In the last 2 months, did you save at least one item to your Myntra Wishlist (the heart icon ♡) that you have NOT purchased yet?",
  "Q1. Approximately what was the price of this item when you saved it?",
  "Q2. When you saved this item, what best describes your intention?",
  "Q3. What is the MAIN reason you haven't purchased this item yet?",
  "Q4. After you saved this item, did Myntra send you any notification about it?",
  "Q5. After saving this item, did you do any of the following?",
  "Q6. After saving this item to your Wishlist, did you notice its price change?",
  "Q7. Today, what is the status of this item?",
  "Q8. If ONE thing could have made you more likely to already purchase this item, what would it be?",
  "Q9. In 2–3 sentences, describe what happened between saving this item and not buying it. What was going through your mind?",
  "Q10. [Optional] How many items do you currently have in your Myntra Wishlist?",
  "Open to a brief 10-min interview?",
  "City",
  "Interview Availability",
  "Contact Details (Email / WhatsApp)"
];

let tsv = headers.join("\t") + "\n";

for (const r of data) {
  const row = [
    r.timestamp,
    r.s1,
    r.s2,
    r.s3,
    r.q1,
    r.q2,
    r.q3,
    r.q4,
    r.q5,
    r.q6,
    r.q7,
    r.q8,
    r.q9,
    r.q10,
    r.interviewOptIn,
    r.city,
    r.interviewAvailability,
    r.contactDetails
  ];
  tsv += row.map(v => (v || "").toString().replace(/\t/g, " ").replace(/\n/g, " ")).join("\t") + "\n";
}

fs.writeFileSync("scaled_responses_23.tsv", tsv, "utf8");
console.log("TSV file created!");
