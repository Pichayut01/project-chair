(async () => {
    try {
        const res = await fetch('http://localhost:5000/api/stream/60c72b2f9b1d8b3a4c8e4a1a/60c72b2f9b1d8b3a4c8e4a1b/comment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: "Hello" })
        });
        const data = await res.json().catch(e => res.statusText);
        console.log(`Status: ${res.status}`);
        console.log("Data:", data);
    } catch (err) {
        console.log("Network Error:", err.message);
    }
})();
