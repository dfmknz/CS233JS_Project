// Created by Drew McKenzie, 5/28/25



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

    // Add event listeners
    this.$form.onsubmit = this.onFormSubmit.bind(this);
    
    // supposed to make dev changes without reload
    if (module.hot) {
      // many changes still need a dev server restart (sadly)
      module.hot.accept();  
    }
  }

  async onFormSubmit(event) {
    event.preventDefault();

    const stamp = new Date();// timestamp of submit

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
            content: prompt + "\n" + this.getRecentHistory(stamp),
          },
        ],
        model: 'deepseek/deepseek-chat:free' // Using the model from your server.js
        //model: 'deepseek/deepseek-coder:free' // Alternative for coding tasks
        //model: 'deepseek/deepseek-v3-base:free'
        //model: 'meta-llama/llama-3.3-8b-instruct:free'
      };

      // call to OpenRouter API
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
        const stampStr = stamp.toLocaleTimeString();
        this.$responseContainer.innerHTML = `
          <div class="response">${aiResponse}</div>
          <p><strong>Model:</strong> ${data.model}</p>
          <p><small>Response time: ${stampStr}</small></p>
        `;

        // add to local storage
        this.addToHistory(stamp, prompt, aiResponse);

        // reset the prompt field
        this.$promptInput.value = "";

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
  // keep a chat history with local storage
  addToHistory(timestamp, prompt, response)
  {
    const entry = { timestamp, prompt, response }; // params to object

    // de-string the history JSON and add the entry
    let history = JSON.parse(localStorage.getItem('history') || '[]');
    history.push(entry);

    // Keep this amount of entries
    if (history.length > 999) {
        history = history.slice(-100);
    }
    // back to string we go
    localStorage.setItem('history', JSON.stringify(history));

    console.log(this.getRecentHistory(timestamp));
  }
  // give me my history back
  parseHistory()
  {
    let history = JSON.parse(localStorage.getItem('history') || '[]');
    return history;
  }
  getRecentHistory(timestamp)
  {
    // some time variables
    const second = 1000;
    const minute = 60 * second;
    const hour = 60 * minute;

    const myRange = minute * 60; // custom range

    let history = JSON.parse(localStorage.getItem('history') || '[]');
    let result = "";

    // if history exists
    if (history.length > 0) {
      // if the last item is recent (JSON does not preserve obj)
      if (timestamp - new Date(history[history.length - 1].timestamp) < myRange) {
        // preface with some info for the chatbat
        result += "Do not make verbal aknowledgements of this part: Answer or respond to above using the below information as context when it seems necessary. Don't say things like 'based on the context..' just keep it to yourself in order to preserve a natural conversation";

        history.forEach(entry => {
          // get the time difference foreach entry
          if ((timestamp - new Date(entry.timestamp)) < myRange)
          {
            // add the entry to the result
            result += "\n" + JSON.stringify(entry);
          }
        });
      }
      else {
        result += "You can treat this as the start of a new conversation";
      }
    }
    return result;
  }

  
}

window.onload = () => {new ChatApp()};