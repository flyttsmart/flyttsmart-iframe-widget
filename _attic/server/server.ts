/**
 * flyttsmart-iframe-widget
 * @author Patrik Forsberg <patrik@flyttsmart.se>
 * @date 2023-06-08
 */

const express = require('express');
const path = require('path');

const app = express();
const port = 3020;

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

console.log("PATH ::", path.join(__dirname, 'public'));

// Start the server
app.listen(port, () => {
	console.log(`Server is running on http://localhost:${port}`);
});
