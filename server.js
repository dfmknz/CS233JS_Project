// Created by Drew McKenzie, 6/2/25

const express = require('express'); // handles incoming requests
const cors = require('cors'); // middleware
const axios = require('axios'); // handles outgoing requests
require('dotenv').config(); // For loading environment variables

const app = express();

// set the port from the env file or default
const port = process.env.PORT || 3000;

// Middleware
//app.use(cors()); // Enable CORS for frontend requests
app.use(cors({
  origin: process.env.APP_DOMAIN + ':8081', // Allow requests from the frontend
}));

app.use(express.json()); // parse JSON request bodies
app.use(express.static('src')); // serve files from 'src' dir

// environment variable for API key
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// proxy endpoint for OpenRouter completions
app.post('/api/completions', async (req, res) => {
  try {
    // create request data with hardcoded model
    const requestData = {
      ...req.body,
      //model: 'deepseek/deepseek-coder:free' // or deepseek-chat if you're not coding
      model: 'deepseek/deepseek-chat:free'
      //model: 'deepseek/deepseek-v3-base:free' // Hardcode the model ID here
      //model: 'meta-llama/llama-3.3-8b-instruct:free'
    };

    // Forward the request to OpenRouter with your API key
    const openRouterResponse = await axios({
      method: 'post',
      url: 'https://openrouter.ai/api/v1/chat/completions',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000', // Your app's URL
      },
      data: requestData,
    });

    // Return OpenRouter's response to the frontend
    res.json(openRouterResponse.data);
  } catch (error) {
    console.error('Error proxying to OpenRouter:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || { message: 'Internal server error' }
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});