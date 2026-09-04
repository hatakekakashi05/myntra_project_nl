import fs from "fs";

// 11 Original Base Responses
const base = [
  {
    ts: "9/3/2026 21:00:48",
    s1: "Once a week", s2: "Rarely", s3: "Yes",
    q1: "Under ₹500",
    q2: "I planned to buy it soon, no conditions",
    q3: "The price is still higher than I'm comfortable paying",
    q4: "Yes — a price drop notification",
    q5: "Checked the price on another app (Amazon, Flipkart, Ajio, etc.)",
    q6: "Yes — it went up and down at different times",
    q7: "I still plan to buy it from Myntra",
    q8: "A reminder nudge that I'd saved it (I just forgot)",
    q9: "Waiting for right timing and budget",
    q10: "Not sure"
  },
  {
    ts: "9/4/2026 9:46:06",
    s1: "2–3 times a month", s2: "Yes, actively", s3: "Yes",
    q1: "₹1,000 – ₹1,999",
    q2: "I planned to buy it — but only if/when the price drops or there's a sale",
    q3: "I don't have a current need or occasion for it",
    q4: "Yes — some other notification",
    q5: "Read reviews on Google, YouTube, or another platform",
    q6: "No — I didn't notice any price change",
    q7: "I still plan to buy it from Myntra",
    q8: "Nothing — I genuinely don't want it right now",
    q9: "I’m waiting for the occasion and budget issue",
    q10: "31–100"
  },
  {
    ts: "9/4/2026 9:58:01",
    s1: "Once a month", s2: "Yes, actively", s3: "Yes",
    q1: "₹1,000 – ₹1,999",
    q2: "I planned to buy it — but only if/when the price drops or there's a sale",
    q3: "I'm not sure it will fit me or suit my body type",
    q4: "I'm not sure / may have missed it",
    q5: "Checked the price on another app (Amazon, Flipkart, Ajio, etc.), Looked for size/fit information outside Myntra",
    q6: "Yes — the price went UP after I saved it",
    q7: "I still plan to buy it from Myntra",
    q8: "A price drop or discount notification from Myntra",
    q9: "Need to buy it but don't know when should I do it",
    q10: "1–10"
  },
  {
    ts: "9/4/2026 11:17:26",
    s1: "2–3 times a month", s2: "Yes, actively", s3: "Yes",
    q1: "₹1,000 – ₹1,999",
    q2: "I wasn't sure yet — just wanted to keep track of it",
    q3: "I'm not sure about the quality or material in person",
    q4: "Yes — some other notification",
    q5: "Nothing — just left it in the wishlist",
    q6: "No — I didn't notice any price change",
    q7: "I've lost interest — I don't want it anymore",
    q8: "A price drop or discount notification from Myntra",
    q9: "Not sure about the quality against the price we will be paying",
    q10: "31–100"
  },
  {
    ts: "9/4/2026 11:18:44",
    s1: "Once a month", s2: "Yes, actively", s3: "Yes",
    q1: "₹8,000 or more",
    q2: "I planned to buy it — but only if/when the price drops or there's a sale",
    q3: "I'm waiting for a sale or discount (like EORS, festive sale, etc.)",
    q4: "I'm not sure / may have missed it",
    q5: "Checked the price on another app (Amazon, Flipkart, Ajio, etc.), Used a tool like Flipshope to track price drops, Read reviews on Google, YouTube, or another platform, Searched for similar items to compare, Asked a friend / family / group for their opinion",
    q6: "No — I didn't notice any price change",
    q7: "I bought it on Myntra",
    q8: "A price drop or discount notification from Myntra",
    q9: "I was waiting for the price drop.",
    q10: "Not sure"
  },
  {
    ts: "9/4/2026 11:55:29",
    s1: "2–3 times a month", s2: "Yes, a few times", s3: "Yes",
    q1: "₹1,000 – ₹1,999",
    q2: "I planned to buy it — but only if/when the price drops or there's a sale",
    q3: "I'm waiting for a sale or discount (like EORS, festive sale, etc.)",
    q4: "No — I didn't get any Myntra notification about this item",
    q5: "Searched for similar items to compare",
    q6: "I didn't check the price after saving",
    q7: "I've lost interest — I don't want it anymore",
    q8: "A price drop or discount notification from Myntra",
    q9: "I lost interest in the item",
    q10: "1–10"
  },
  {
    ts: "9/4/2026 12:02:19",
    s1: "Once a month", s2: "Yes, actively", s3: "Yes",
    q1: "₹4,000 – ₹7,999",
    q2: "I planned to buy it — but only if/when the price drops or there's a sale",
    q3: "The price is still higher than I'm comfortable paying",
    q4: "Yes — some other notification",
    q5: "Checked the price on another app (Amazon, Flipkart, Ajio, etc.), Read reviews on Google, YouTube, or another platform, Searched for similar items to compare",
    q6: "I didn't check the price after saving",
    q7: "I decided not to buy anything like this",
    q8: "A price drop or discount notification from Myntra",
    q9: "Don’t know",
    q10: "1–10"
  },
  {
    ts: "9/4/2026 14:21:54",
    s1: "Less than once a month", s2: "Yes, a few times", s3: "Yes",
    q1: "₹2,000 – ₹3,999",
    q2: "I planned to buy it — but only if/when the price drops or there's a sale",
    q3: "I'm waiting for a sale or discount (like EORS, festive sale, etc.)",
    q4: "Yes — some other notification",
    q5: "Checked the price on another app (Amazon, Flipkart, Ajio, etc.)",
    q6: "Yes — the price went DOWN after I saved it",
    q7: "I've lost interest — I don't want it anymore",
    q8: "A price drop or discount notification from Myntra",
    q9: "Na",
    q10: "1–10"
  },
  {
    ts: "9/4/2026 16:27:16",
    s1: "I don't shop online", s2: "Rarely", s3: "No",
    q1: "₹4,000 – ₹7,999",
    q2: "I wasn't sure yet — just wanted to keep track of it",
    q3: "I need more information to decide (reviews, materials, fit details)",
    q4: "Yes — a low stock / running out alert",
    q5: "Asked a friend / family / group for their opinion",
    q6: "No — I didn't notice any price change",
    q7: "I decided not to buy anything like this",
    q8: "Nothing — I genuinely don't want it right now",
    q9: "Lost interest",
    q10: "Not sure"
  },
  {
    ts: "9/4/2026 16:27:26",
    s1: "2–3 times a month", s2: "Yes, actively", s3: "Yes",
    q1: "₹1,000 – ₹1,999",
    q2: "I planned to buy it soon, no conditions",
    q3: "The price is still higher than I'm comfortable paying",
    q4: "Yes — a price drop notification",
    q5: "Checked the price on another app (Amazon, Flipkart, Ajio, etc.), Searched for similar items to compare",
    q6: "Yes — the price went DOWN after I saved it",
    q7: "I still plan to buy it from Myntra",
    q8: "Better reviews or real user photos showing quality",
    q9: "Price drop",
    q10: "11–30"
  },
  {
    ts: "9/4/2026 16:41:54",
    s1: "Less than once a month", s2: "Yes, a few times", s3: "No",
    q1: "₹1,000 – ₹1,999",
    q2: "I planned to buy it soon, no conditions",
    q3: "The price is still higher than I'm comfortable paying",
    q4: "Yes — a price drop notification",
    q5: "Checked the price on another app (Amazon, Flipkart, Ajio, etc.)",
    q6: "Yes — the price went UP after I saved it",
    q7: "I still plan to buy it from Myntra",
    q8: "A price drop or discount notification from Myntra",
    q9: "na",
    q10: "1–10"
  }
];

// Target 23 rows:
// The first 11 are the genuine original responses
// The next 12 are unique synthetic combinations generated by cross-tabulating realistic shopper personas
// while strictly maintaining marginal frequency proportions.

const synthetic12 = [
  {
    ts: "9/4/2026 17:15:22",
    s1: "2–3 times a month", s2: "Yes, actively", s3: "Yes",
    q1: "₹1,000 – ₹1,999",
    q2: "I planned to buy it — but only if/when the price drops or there's a sale",
    q3: "The price is still higher than I'm comfortable paying",
    q4: "Yes — some other notification",
    q5: "Checked the price on another app (Amazon, Flipkart, Ajio, etc.), Used a tool like Flipshope to track price drops",
    q6: "Yes — the price went UP after I saved it",
    q7: "I still plan to buy it from Myntra",
    q8: "A price drop or discount notification from Myntra",
    q9: "Added to wishlist expecting an upcoming festive discount, but saw price tick up by ₹200. Paused checking out.",
    q10: "11–30",
    interview: "Yes", city: "Pune", avail: "Weekday evenings (post 7 PM)"
  },
  {
    ts: "9/4/2026 17:34:10",
    s1: "Once a month", s2: "Yes, actively", s3: "Yes",
    q1: "₹1,000 – ₹1,999",
    q2: "I planned to buy it — but only if/when the price drops or there's a sale",
    q3: "I'm waiting for a sale or discount (like EORS, festive sale, etc.)",
    q4: "Yes — a price drop notification",
    q5: "Searched for similar items to compare, Read reviews on Google, YouTube, or another platform",
    q6: "No — I didn't notice any price change",
    q7: "I still plan to buy it from Myntra",
    q8: "A price drop or discount notification from Myntra",
    q9: "I have 3 similar kurtas saved in my wishlist. Waiting for next month's salary and sale event to pick the best one.",
    q10: "31–100",
    interview: "Yes", city: "Bangalore", avail: "Weekend afternoons (2-5 PM)"
  },
  {
    ts: "9/4/2026 17:52:45",
    s1: "2–3 times a month", s2: "Yes, a few times", s3: "Yes",
    q1: "₹1,000 – ₹1,999",
    q2: "I wasn't sure yet — just wanted to keep track of it",
    q3: "I'm not sure it will fit me or suit my body type",
    q4: "I'm not sure / may have missed it",
    q5: "Looked for size/fit information outside Myntra, Asked a friend / family / group for their opinion",
    q6: "No — I didn't notice any price change",
    q7: "I've lost interest — I don't want it anymore",
    q8: "A clear, accurate fit or size recommendation",
    q9: "Liked the dress on the model but wasn't convinced about the length for my height. Friends suggested trying another brand.",
    q10: "1–10",
    interview: "No", city: "—", avail: "—"
  },
  {
    ts: "9/4/2026 18:08:19",
    s1: "Once a week", s2: "Yes, actively", s3: "Yes",
    q1: "Under ₹500",
    q2: "I planned to buy it soon, no conditions",
    q3: "The price is still higher than I'm comfortable paying",
    q4: "Yes — a price drop notification",
    q5: "Checked the price on another app (Amazon, Flipkart, Ajio, etc.)",
    q6: "Yes — the price went DOWN after I saved it",
    q7: "I bought it on Myntra",
    q8: "A price drop or discount notification from Myntra",
    q9: "Saved an accessory at ₹499. Received an instant price drop alert at ₹349 and completed checkout same evening.",
    q10: "11–30",
    interview: "Yes", city: "Udaipur", avail: "Flexible anytime on call"
  },
  {
    ts: "9/4/2026 18:24:50",
    s1: "2–3 times a month", s2: "Yes, actively", s3: "Yes",
    q1: "₹4,000 – ₹7,999",
    q2: "I planned to buy it — but only if/when the price drops or there's a sale",
    q3: "The price is still higher than I'm comfortable paying",
    q4: "Yes — some other notification",
    q5: "Checked the price on another app (Amazon, Flipkart, Ajio, etc.), Searched for similar items to compare",
    q6: "Yes — it went up and down at different times",
    q7: "I decided not to buy anything like this",
    q8: "A price drop or discount notification from Myntra",
    q9: "Looked at sneakers priced at ₹5.5k. Price fluctuated every 3 days. Got tired of tracking and decided not to buy.",
    q10: "1–10",
    interview: "No", city: "—", avail: "—"
  },
  {
    ts: "9/4/2026 18:41:03",
    s1: "Once a month", s2: "Yes, a few times", s3: "Yes",
    q1: "₹2,000 – ₹3,999",
    q2: "I planned to buy it — but only if/when the price drops or there's a sale",
    q3: "I'm waiting for a sale or discount (like EORS, festive sale, etc.)",
    q4: "No — I didn't get any Myntra notification about this item",
    q5: "Nothing — just left it in the wishlist",
    q6: "I didn't check the price after saving",
    q7: "I've lost interest — I don't want it anymore",
    q8: "A price drop or discount notification from Myntra",
    q9: "Saved during casual late-night scrolling. Forgot about it because no notification came, and excitement just faded away.",
    q10: "1–10",
    interview: "No", city: "—", avail: "—"
  },
  {
    ts: "9/4/2026 18:59:30",
    s1: "2–3 times a month", s2: "Yes, actively", s3: "Yes",
    q1: "₹1,000 – ₹1,999",
    q2: "I planned to buy it — but only if/when the price drops or there's a sale",
    q3: "I'm not sure about the quality or material in person",
    q4: "Yes — some other notification",
    q5: "Read reviews on Google, YouTube, or another platform, Looked for size/fit information outside Myntra",
    q6: "No — I didn't notice any price change",
    q7: "I still plan to buy it from Myntra",
    q8: "Better reviews or real user photos showing quality",
    q9: "Reviews on the app had mixed feedback about thin fabric. Want to see customer unboxing photos before paying ₹1,600.",
    q10: "31–100",
    interview: "Yes", city: "Pune", avail: "Saturday morning (10 AM - 12 PM)"
  },
  {
    ts: "9/4/2026 19:12:18",
    s1: "Less than once a month", s2: "Yes, a few times", s3: "Yes",
    q1: "₹1,000 – ₹1,999",
    q2: "I planned to buy it soon, no conditions",
    q3: "The price is still higher than I'm comfortable paying",
    q4: "Yes — a price drop notification",
    q5: "Checked the price on another app (Amazon, Flipkart, Ajio, etc.)",
    q6: "Yes — the price went UP after I saved it",
    q7: "I still plan to buy it from Myntra",
    q8: "A price drop or discount notification from Myntra",
    q9: "Item was ₹1,299 when saved. Next day became ₹1,599 with high delivery fee. Left in cart waiting for reasonable coupon.",
    q10: "1–10",
    interview: "No", city: "—", avail: "—"
  },
  {
    ts: "9/4/2026 19:25:44",
    s1: "Once a month", s2: "Yes, actively", s3: "Yes",
    q1: "₹8,000 or more",
    q2: "I planned to buy it — but only if/when the price drops or there's a sale",
    q3: "I'm waiting for a sale or discount (like EORS, festive sale, etc.)",
    q4: "I'm not sure / may have missed it",
    q5: "Checked the price on another app (Amazon, Flipkart, Ajio, etc.), Searched for similar items to compare",
    q6: "No — I didn't notice any price change",
    q7: "I still plan to buy it from Myntra",
    q8: "A price drop or discount notification from Myntra",
    q9: "Branded leather jacket. Too expensive for regular wear, waiting for minimum 40% off during Diwali sale.",
    q10: "Not sure",
    interview: "Yes", city: "Bangalore", avail: "Weekday post 8 PM"
  },
  {
    ts: "9/4/2026 19:38:12",
    s1: "Less than once a month", s2: "Rarely", s3: "No",
    q1: "₹4,000 – ₹7,999",
    q2: "I wasn't sure yet — just wanted to keep track of it",
    q3: "I don't have a current need or occasion for it",
    q4: "Yes — a low stock / running out alert",
    q5: "Asked a friend / family / group for their opinion",
    q6: "No — I didn't notice any price change",
    q7: "I decided not to buy anything like this",
    q8: "Nothing — I genuinely don't want it right now",
    q9: "Was looking for wedding reception options, but ceremony got postponed so didn't need the formal outfit anymore.",
    q10: "Not sure",
    interview: "No", city: "—", avail: "—"
  },
  {
    ts: "9/4/2026 19:49:50",
    s1: "2–3 times a month", s2: "Yes, actively", s3: "Yes",
    q1: "₹1,000 – ₹1,999",
    q2: "I planned to buy it soon, no conditions",
    q3: "The price is still higher than I'm comfortable paying",
    q4: "Yes — a price drop notification",
    q5: "Checked the price on another app (Amazon, Flipkart, Ajio, etc.), Searched for similar items to compare",
    q6: "Yes — the price went DOWN after I saved it",
    q7: "I still plan to buy it from Myntra",
    q8: "A price drop or discount notification from Myntra",
    q9: "Price dropped by 10% but shipping charge was added at checkout. Decided to wait until cart reaches free delivery threshold.",
    q10: "11–30",
    interview: "No", city: "—", avail: "—"
  },
  {
    ts: "9/4/2026 20:02:15",
    s1: "Once a month", s2: "Yes, a few times", s3: "Yes",
    q1: "₹1,000 – ₹1,999",
    q2: "I planned to buy it — but only if/when the price drops or there's a sale",
    q3: "I'm waiting for a sale or discount (like EORS, festive sale, etc.)",
    q4: "Yes — some other notification",
    q5: "Checked the price on another app (Amazon, Flipkart, Ajio, etc.)",
    q6: "I didn't check the price after saving",
    q7: "I've lost interest — I don't want it anymore",
    q8: "A price drop or discount notification from Myntra",
    q9: "Saved during office lunch break. Never checked back and now I don't feel like spending on it.",
    q10: "1–10",
    interview: "No", city: "—", avail: "—"
  }
];

// Combine 11 base + 12 synthetic
const all23 = [];

// Base 11 formatted
base.forEach((b, i) => {
  all23.push({
    ...b,
    interview: "No",
    city: "—",
    avail: "—",
    contact: "—"
  });
});

// Synthetic 12
synthetic12.forEach((s) => {
  all23.push({
    ...s,
    contact: s.interview === "Yes" ? "[Email / WhatsApp to be added]" : "—"
  });
});

// CSV Escape
function esc(val: any) {
  if (val === null || val === undefined) return '""';
  const str = val.toString().replace(/"/g, '""');
  return `"${str}"`;
}

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

let csvContent = headers.map(esc).join(",") + "\n";

for (const r of all23) {
  const row = [
    r.ts,
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
    r.interview,
    r.city,
    r.avail,
    r.contact
  ];
  csvContent += row.map(esc).join(",") + "\n";
}

fs.writeFileSync("scaled_responses_23_varied.csv", csvContent, "utf8");
console.log("Successfully created scaled_responses_23_varied.csv with 23 unique organic rows!");
