// app.js
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes'); // Assuming your routes are in routes.js

const app = express();

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies

// Mount your API routes
app.use('/api', apiRoutes);

// Basic root route
app.get('/', (req, res) => {
    res.send('Welcome to the Library API!');
});

// Error handling middleware (optional but good practice)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Access API at http://localhost:${PORT}/api`);
});