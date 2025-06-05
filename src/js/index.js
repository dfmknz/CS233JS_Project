// Created by Drew McKenzie, 5/28/25



import './general';
const regeneratorRuntime = require("regenerator-runtime");

import toastr from 'toastr';
import 'toastr/toastr.scss';

// Environment configuration
const APP_URL = APP_URL || 'http://localhost:3000';

// time constants
const SECOND = 1000; // 1000 milliseconds
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

class ChatApp {
  constructor() {
    this.$form = document.getElementById('chat-form');
    this.$promptInput = document.getElementById('prompt-input');
    this.$responseContainer = document.getElementById('response-container');
    this.$prompts = this.$responseContainer.getElementsByClassName('prompt');
    this.$responsePlaceholder = document.getElementById('response-placeholder');
    this.$modelInfo = document.getElementById('model-info');
    this.$retentionSelect = document.getElementById('retention');

    this.addEventListeners();
   
    // supposed to make dev changes without reload
    if (module.hot) {
      // many changes still need a dev server restart (sadly)
      module.hot.accept();  
    }
    this.$responsePlaceholder.style.visibility = 'hidden'; // default to hidden
    // get recent history and add it to the container
    this.addHistoryToContainer(this.getRecentHistory(new Date()));

    this.scrollToElementStart(this.$form);
    this.loadRetention();
  }

  addEventListeners() {
    this.$form.onsubmit = this.onFormSubmit.bind(this);
    this.$retentionSelect.addEventListener('change', () => {
      localStorage.setItem('retention', this.$retentionSelect.value);
    });
  }

  async onFormSubmit(event) {
    event.preventDefault();

    const stamp = new Date();// timestamp of submit

    const prompt = this.$promptInput.value.trim();
    if (!prompt) return;

    // Show loading state
    this.$responseContainer.insertAdjacentHTML('beforeend', `<div class="loading">Generating response...</div>`);

    try {
      console.log(`Sending request to OpenRouter...`);

      // Create request data with hardcoded model
      const requestData = {
        messages: [
          {
            role: `user`,
            content: this.getRecentHistoryForBot(stamp) + "\nLAST_PROMPT\n" + prompt,
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
        const aiResponse = data.choices[0].message.content;
        const stampStr = stamp.toLocaleTimeString();

        // update the page
        this.updateModelInfo(data.model);
        this.addToContainer(prompt, aiResponse, stamp);

        // add to local storage
        this.addToHistory(stamp, prompt, aiResponse);

        // reset the prompt field
        this.$promptInput.value = "";

        this.scrollToElementStart(this.$prompts[this.$prompts.length - 1]);
        
      } else {
        // Handle error response
        this.$responseContainer.insertAdjacentHTML('beforeend', `
          <div class="error">Error: ${data.error?.message || `Unknown error`}</div>
          <pre>${JSON.stringify(data, null, 2)}</pre>
        `);
      }
    } catch (error) {
      console.error(`Error:`, error);
      this.$responseContainer.insertAdjacentHTML('beforeend', `<div class="error">Error: ${error.message}</div>`);
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
  }
  
  // returns an array of history objects
  getRecentHistory(timestamp)
  {
    const myRange = this.calculateRetention(); // retention range

    let history = JSON.parse(localStorage.getItem('history') || '[]');
    let result = [];

    // if history exists
    if (history.length > 0) {
      // if the last item is recent (JSON does not preserve obj)
      if (timestamp - new Date(history[history.length - 1].timestamp) < myRange) {

        history.forEach(entry => {
          // get the time difference foreach entry
          if ((timestamp - new Date(entry.timestamp)) < myRange)
          {
            // add the entry to the result
            result.push(entry);
          }
        });
      }
    }
    else {
      this.$responsePlaceholder.style.visibility = 'visible';
    }
    return result;
  }
  // returns a string with history meant for use with the prompt
  getRecentHistoryForBot(timestamp)
  {
    const myRange = this.calculateRetention(); // retention range

    let history = JSON.parse(localStorage.getItem('history') || '[]');
    let result = "";

    // if history exists
    if (history.length > 0) {
      // if the last item is recent (JSON does not preserve obj)
      if (timestamp - new Date(history[history.length - 1].timestamp) < myRange) {
        
        // preface with some info for the chatbat
        result += "\n\nRespond to the LAST_PROMPT below. \n\nDo not make verbal aknowledgements of this part: Answer or respond using all of the chat history here as context when it seems necessary (this especially imporant when the LAST_PROMPT is trying to address something the history. Don't say things like 'based on the context..' just keep it to yourself in order to preserve a natural conversation. Make sure to respond to the LAST_PROMPT. The rest of the history is only for context, but treat the most recent responses as if they're more contextually relevant. Keep the timestamps in mind. Each item in the history will have one. Also please don't act like you have to assist with something either. Be prepared for any situation.\n";
      

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

  scrollToElementStart(element) {
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  addToContainer(prompt, response, timestamp) {
    // add current response
    this.$responseContainer.insertAdjacentHTML('beforeend', `
      <div class="prompt">${prompt}</div>
      <div class="response">${response}</div>
      <p><small>Response time: ${timestamp.toLocaleTimeString()}</small></p>
    `);
  }

  addHistoryToContainer(historyObj)
  {
    let prompt;
    let response;
    historyObj.forEach(entry => {
      prompt = entry.prompt.toString();
      response = entry.response.toString();
      this.$responseContainer.insertAdjacentHTML('beforeend', `
        <div class="prompt">${prompt}</div>
        <div class="response">${response}</div>
        <p><small>Response time: ${new Date(entry.timestamp).toLocaleTimeString()}</small></p>
      `);
      console.log(entry);
    });
  }

  updateModelInfo(model) {
    // display model info on the page
    this.$modelInfo.innerHTML = `
        <p><strong>Model:</strong> ${model}</p>
      `;
  }
  loadRetention()
  {
    const retentionValue = localStorage.getItem('retention');
    if (retentionValue) {
      this.$retentionSelect.value = retentionValue;
    }
  }
  // calculate the selection w/out regex
  calculateRetention()
  {
    let val = this.$retentionSelect.value;
    // if the last char is m for minutes
    if (val[val.length - 1] === "m") {
      val = Number(val.substr(0, val.length - 1)); // extract the number
      val = val * MINUTE;
    }
    if (val[val.length - 1] === "h") {
      val = Number(val.substr(0, val.length - 1)); // extract the number
      val = val * HOUR;
    }
    return val;
  }
  
}

window.onload = () => {new ChatApp()};