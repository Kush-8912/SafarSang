const apiKey = "AIzaSyAMBsdfhRN4v5dSfWTee-QSU0VUcNesuIY";
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
const payload = {
  contents: [{ parts: [{ text: "test" }] }],
};
fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
}).then(async r => {
  console.log("Status:", r.status, r.statusText);
  console.log("Body:", await r.text());
}).catch(console.error);
