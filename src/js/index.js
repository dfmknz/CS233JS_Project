// Combined JavaScript file - Created by Drew McKenzie
// Combines client-side chat functionality with direct API calls


import './general';
const regeneratorRuntime = require("regenerator-runtime");

import toastr from 'toastr';
import 'toastr/toastr.scss';

// Environment configuration
const APP_URL = APP_URL || 'http://localhost:3000';

class ChatApp {
  constructor() {
    this.$form = document.getElementById(`chat-form`);
    this.$promptInput = document.getElementById(`prompt-input`);
    this.$responseContainer = document.getElementById(`response-container`);

    // example prompt for testing
    //this.$promptInput.value = `Write a small JSON file with some common regular expressions without using any nested braces. Give me only the JSON, nothing else.`;

    // Add event listeners
    this.$form.onsubmit = this.onFormSubmit.bind(this);

    if (module.hot) {
      module.hot.accept();
    }
  }

  async onFormSubmit(event) {
    event.preventDefault();

    const prompt = this.$promptInput.value.trim();
    if (!prompt) return;

    // Show loading state
    this.$responseContainer.innerHTML = `<div class="loading">Generating response...</div>`;

    try {
      console.log(`Sending request to OpenRouter...`);

      // Create request data with hardcoded model (from server.js)
      const requestData = {
        messages: [
          {
            role: `user`,
            content: prompt,
          },
        ],
        model: 'deepseek/deepseek-chat:free' // Using the model from your server.js
        //model: 'deepseek/deepseek-coder:free' // Alternative for coding tasks
        //model: 'deepseek/deepseek-v3-base:free'
        //model: 'meta-llama/llama-3.3-8b-instruct:free'
      };

      // Direct call to OpenRouter API (instead of going through Express server)
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: `POST`,
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': `application/json`,
          'HTTP-Referer': APP_URL,
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();
      console.log(`Received response:`, data);

      if (response.ok) {
        // Display the response
        const aiResponse = data.choices[0].message.content;
        this.$responseContainer.innerHTML = `
          <div class="response">${aiResponse}</div>
          <p><strong>Model:</strong> ${data.model}</p>
          <p><small>Response time: ${new Date().toLocaleTimeString()}</small></p>
        `;
      } else {
        // Handle error response
        this.$responseContainer.innerHTML = `
          <div class="error">Error: ${data.error?.message || `Unknown error`}</div>
          <pre>${JSON.stringify(data, null, 2)}</pre>
        `;
      }
    } catch (error) {
      console.error(`Error:`, error);
      this.$responseContainer.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    }
  }
}

window.onload = () => {new ChatApp()};
//document.addEventListener(`DOMContentLoaded`, () => );