const express = require('express');
const app = express();

app.use(express.json());

// Import routes
const postRoutes = require('./routes/postRoutes');
app.use('/api/posts', postRoutes);

module.exports = app;