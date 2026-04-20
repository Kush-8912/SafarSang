fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=invalid_key", { method: 'POST' }).then(r => console.log(r.status));
