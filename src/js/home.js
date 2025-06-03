// Created by Drew McKenzie, 5/28/25

import './general';
const regeneratorRuntime = require("regenerator-runtime");

import toastr from 'toastr';
import 'toastr/toastr.scss';


class ChatApp {
  constructor() {
    this.$form = document.getElementById(`chat-form`);
    this.$promptInput = document.getElementById(`prompt-input`);
    this.$responseContainer = document.getElementById(`response-container`);

    // example prompt for testing
    //this.$promptInput.value = `Write a small JSON file with some common regular expressions without using any nested braces. Give me only the JSON, nothing else.`;

    // Add event listeners
    this.$form.onsubmit = this.onFormSubmit.bind(this);
  }

  async onFormSubmit(event) {
    event.preventDefault();

    const prompt = this.$promptInput.value.trim();
    if (!prompt) return;

    // Show loading state
    this.$responseContainer.innerHTML = `<div class="loading">Generating response...</div>`;

    try {
      console.log(`Sending request to backend...`);

      const response = await fetch(`${APP_DOMAIN}:${PORT}/api/completions`, {
        method: `POST`,
        headers: {
          'Content-Type': `application/json`,
        },
        body: JSON.stringify({
          messages: [
            {
              role: `user`,
              content: prompt,
            },
          ],
        }),
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