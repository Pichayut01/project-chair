const express = require('express');
const path = require('path');
const app = express();
const PORT = 5500;

// Serve static files with no-cache headers
app.use(express.static(__dirname, {
    setHeaders: (res, path) => {
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    }
}));

// Serve index.html for the root route with no-cache
app.get('/', (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`===============================================`);
    console.log(`   Admin Panel Server Running`);
    console.log(`   URL: http://localhost:${PORT}`);
    console.log(`===============================================`);
});
