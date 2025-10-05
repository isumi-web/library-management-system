const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const routes = require('../routes'); // Points to backend/routes.js

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use('/api', routes); // Mounts all routes (/api/books, /api/members, /api/transactions)

app.get('/', (req, res) => {
  res.send('Library Management System Backend');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

app.get('/test', (req, res) => {
  res.send('Test route working');
});