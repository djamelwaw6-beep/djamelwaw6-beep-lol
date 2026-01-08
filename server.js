// server.js
const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Serve static files from the Angular dist folder
// We assume your Angular build outputs to 'dist/client'
const angularAppPath = path.join(__dirname, 'dist', 'client');
app.use(express.static(angularAppPath));

// Handle all other routes by serving the index.html file
// This is important for client-side routing (Angular's router)
app.get('*', (req, res) => {
  res.sendFile(path.join(angularAppPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  console.log(`Serving Angular app from: ${angularAppPath}`);
  console.log('To run your Angular app, make sure you have built it first (e.g., ng build --output-path dist/client)');
  console.log('For Gemini API_KEY, ensure it is set in your environment before building the Angular app.');
});
