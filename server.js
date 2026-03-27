const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname)));

// Share URL rewrite: /share/:token -> view.html
app.get('/share/:token', (req, res) => {
  res.sendFile(path.join(__dirname, 'view.html'));
});

// SPA fallback — serve index.html for unknown routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log('Floor Plan Builder running on port ' + PORT);
});
