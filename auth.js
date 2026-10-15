const SESSION_KEY = "gicaCreatorSession";

/* =========================================================
   OTP STATE
========================================================= */

const OTP_VALUE_KEY = "gica_email_otp";
const OTP_EMAIL_KEY = "gica_otp_email";
const OTP_VERIFIED_KEY = "gica_email_verified";

let otpVerified = false;
let otpEmail = "";
let emailVerificationToken = "";
let otpTimerInterval = null;
let otpSeconds = 60;

/* =========================================================
   REGISTRATION OTP ELEMENTS
========================================================= */

const registerForm = document.getElementById("registerForm");
const emailInput = document.getElementById("email");
const sendOtpBtn = document.getElementById("sendOtpBtn");
const emailOtpSection = document.getElementById("emailOtpSection");
const emailOtpInput = document.getElementById("emailOtp");
const verifyOtpBtn = document.getElementById("verifyOtpBtn");
const resendOtpBtn = document.getElementById("resendOtpBtn");
const otpTimer = document.getElementById("otpTimer");
const otpStatus = document.getElementById("otpStatus");
const emailVerifiedBadge = document.getElementById("emailVerifiedBadge");

/* =========================================================
   HELPERS
========================================================= */

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function clearOtpStorage() {
  sessionStorage.removeItem(OTP_VALUE_KEY);
  sessionStorage.removeItem(OTP_EMAIL_KEY);
  sessionStorage.removeItem(OTP_VERIFIED_KEY);

  // Remove values written by the older version that used a dotless i.
  sessionStorage.removeItem("gıca_email_otp");
  sessionStorage.removeItem("gıca_otp_email");
  sessionStorage.removeItem("gıca_email_verified");
}

/* =========================================================
   SEND OTP
========================================================= */

async function sendEmailOtp() {
  const email = normalizeEmail(emailInput?.value);

  clearStatus(registerForm?.querySelector(".form-status"));
  showOtpStatus("", false);

  if (!email) {
    showOtpStatus("Please enter your email address.", true);
    emailInput?.focus();
    return;
  }

  if (!isValidEmail(email)) {
    showOtpStatus("Please enter a valid email address.", true);
    emailInput?.focus();
    return;
  }

  if (!window.GicaApi?.request) {
    showOtpStatus("API client is not available. Please refresh the page.", true);
    return;
  }

  try {
    setOtpLoading(sendOtpBtn, true, "Sending…");

    // Sending a new OTP always invalidates any previous verification.
    otpVerified = false;
    otpEmail = email;
    emailVerificationToken = "";

    if (emailVerifiedBadge) {
      emailVerifiedBadge.style.display = "none";
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));

    await window.GicaApi.request("/api/emailotp/sendotp", {
      method: "POST",
      body: {
        email,
        otp,
      },
    });

    sessionStorage.setItem(OTP_VALUE_KEY, otp);
    sessionStorage.setItem(OTP_EMAIL_KEY, email);
    sessionStorage.removeItem(OTP_VERIFIED_KEY);

    if (emailOtpSection) {
      emailOtpSection.style.display = "block";
    }

    if (emailOtpInput) {
      emailOtpInput.value = "";
      emailOtpInput.disabled = false;
      emailOtpInput.focus();
    }

    if (verifyOtpBtn) {
      verifyOtpBtn.disabled = false;
      verifyOtpBtn.textContent = "Verify";
    }

    showOtpStatus(`OTP sent to ${email}. Enter the 6-digit code.`, false);
    startOtpTimer();
  } catch (error) {
    console.error("Send OTP error:", error);
    showOtpStatus(error?.message || "Failed to send OTP. Please try again.", true);
  } finally {
    setOtpLoading(sendOtpBtn, false, "Send OTP");
  }
}

/* =========================================================
   VERIFY OTP
========================================================= */

function verifyEmailOtp() {
  clearStatus(registerForm?.querySelector(".form-status"));

  const enteredOtp = String(emailOtpInput?.value || "").trim();
  const savedOtp = sessionStorage.getItem(OTP_VALUE_KEY);
  const savedEmail = normalizeEmail(sessionStorage.getItem(OTP_EMAIL_KEY));
  const currentEmail = normalizeEmail(emailInput?.value);

  if (!savedOtp) {
    showOtpStatus("Please send an OTP first.", true);
    return;
  }

  if (!enteredOtp) {
    showOtpStatus("Please enter the OTP.", true);
    emailOtpInput?.focus();
    return;
  }

  if (!/^\d{6}$/.test(enteredOtp)) {
    showOtpStatus("OTP must be exactly 6 digits.", true);
    emailOtpInput?.focus();
    return;
  }

  if (!currentEmail || savedEmail !== currentEmail) {
    resetOtpVerification();
    showOtpStatus("Email changed. Please send a new OTP.", true);
    return;
  }

  if (enteredOtp !== savedOtp) {
    showOtpStatus("Invalid OTP. Please try again.", true);
    emailOtpInput?.focus();
    return;
  }

  // IMPORTANT: these values are what the submit handler checks.
  otpVerified = true;
  otpEmail = currentEmail;

  // Kept for compatibility with the existing registration payload.
  // This is only a client-side marker; server-side OTP verification is safer.
  emailVerificationToken = `client-verified:${Date.now()}`;

  sessionStorage.setItem(OTP_VERIFIED_KEY, currentEmail);
  sessionStorage.removeItem(OTP_VALUE_KEY);

  clearInterval(otpTimerInterval);

  if (emailVerifiedBadge) {
    emailVerifiedBadge.style.display = "inline-block";
  }

  if (emailOtpInput) {
    emailOtpInput.disabled = true;
  }

  if (verifyOtpBtn) {
    verifyOtpBtn.disabled = true;
    verifyOtpBtn.textContent = "Verified";
  }

  if (resendOtpBtn) {
    resendOtpBtn.disabled = true;
  }

  if (otpTimer) {
    otpTimer.textContent = "";
  }

  showOtpStatus("Email verified successfully.", false);

  // Hide the OTP entry area after showing the success state briefly.
  if (emailOtpSection) {
    setTimeout(() => {
      if (otpVerified && normalizeEmail(emailInput?.value) === otpEmail) {
        emailOtpSection.style.display = "none";
      }
    }, 500);
  }
}

/* =========================================================
   OTP TIMER
========================================================= */

function startOtpTimer() {
  clearInterval(otpTimerInterval);
  otpSeconds = 60;

  if (resendOtpBtn) {
    resendOtpBtn.disabled = true;
  }

  updateOtpTimer();

  otpTimerInterval = setInterval(() => {
    otpSeconds -= 1;
    updateOtpTimer();

    if (otpSeconds <= 0) {
      clearInterval(otpTimerInterval);

      if (otpTimer) {
        otpTimer.textContent = "";
      }

      if (resendOtpBtn && !otpVerified) {
        resendOtpBtn.disabled = false;
      }
    }
  }, 1000);
}

function updateOtpTimer() {
  if (!otpTimer) return;
  otpTimer.textContent = `Resend OTP in ${otpSeconds}s`;
}

/* =========================================================
   RESET OTP WHEN EMAIL CHANGES
========================================================= */

function resetOtpVerification() {
  otpVerified = false;
  otpEmail = "";
  emailVerificationToken = "";

  clearInterval(otpTimerInterval);
  clearOtpStorage();

  if (emailOtpSection) {
    emailOtpSection.style.display = "none";
  }

  if (emailOtpInput) {
    emailOtpInput.value = "";
    emailOtpInput.disabled = false;
  }

  if (verifyOtpBtn) {
    verifyOtpBtn.disabled = false;
    verifyOtpBtn.textContent = "Verify";
  }

  if (sendOtpBtn) {
    sendOtpBtn.disabled = false;
    sendOtpBtn.textContent = "Send OTP";
  }

  if (resendOtpBtn) {
    resendOtpBtn.disabled = true;
  }

  if (otpTimer) {
    otpTimer.textContent = "";
  }

  if (otpStatus) {
    otpStatus.textContent = "";
    otpStatus.classList.remove("error");
  }

  if (emailVerifiedBadge) {
    emailVerifiedBadge.style.display = "none";
  }
}

/* =========================================================
   OTP EVENT LISTENERS
========================================================= */

sendOtpBtn?.addEventListener("click", sendEmailOtp);
verifyOtpBtn?.addEventListener("click", verifyEmailOtp);
resendOtpBtn?.addEventListener("click", sendEmailOtp);

emailOtpInput?.addEventListener("input", function () {
  this.value = this.value.replace(/\D/g, "").slice(0, 6);
  showOtpStatus("", false);
});

emailInput?.addEventListener("input", function () {
  const email = normalizeEmail(this.value);

  // Invalidate an OTP/verification when the user edits the email address.
  const storedOtpEmail = normalizeEmail(sessionStorage.getItem(OTP_EMAIL_KEY));
  const verifiedEmail = otpEmail || normalizeEmail(sessionStorage.getItem(OTP_VERIFIED_KEY));
  const previousEmail = verifiedEmail || storedOtpEmail;

  if (previousEmail && email !== previousEmail) {
    resetOtpVerification();
  }
});

/* =========================================================
   FORM SUBMIT HANDLER
========================================================= */

document.querySelectorAll("[data-demo-form]").forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const status = form.querySelector(".form-status");
    const submitButton = form.querySelector('button[type="submit"]');
    const values = Object.fromEntries(new FormData(form).entries());

    clearStatus(status);

    try {
      if (form.elements.message) {
        setLoading(submitButton, true);
        await submitInquiry(values);
        showStatus(status, "Your inquiry has been submitted successfully.", false);
        form.reset();
        return;
      }

      if (form.elements.confirmPassword) {
        await registerCreator(form, values, status, submitButton);
        return;
      }

      if (form.elements.twoFactor) {
        setLoading(submitButton, true);

        const data = await GicaApi.request("/api/admin/login", {
          method: "POST",
          body: {
            email: values.email,
            password: values.password,
            twoFactor: values.twoFactor,
          },
        });

        localStorage.setItem(
          "gicaAdminSession",
          JSON.stringify({ token: data.token, user: data.user })
        );

        window.location.href = "admin-panel.html";
        return;
      }

      setLoading(submitButton, true);
      await loginCreator(values, status);
    } catch (error) {
      console.error("Authentication error:", error);
      showStatus(
        status,
        error?.message || "Something went wrong. Please try again.",
        true
      );
    } finally {
      setLoading(submitButton, false);
    }
  });
});

/* =========================================================
   CREATOR REGISTRATION
========================================================= */

async function registerCreator(form, values, status, submitButton) {
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const email = normalizeEmail(values.email);

  // This is the key check that was failing before because otpVerified and
  // otpEmail were never updated after a successful OTP comparison.
  if (!otpVerified || email !== otpEmail) {
    showStatus(status, "Please verify your email using OTP.", true);

    if (emailOtpSection) {
      emailOtpSection.style.display = "block";
    }

    if (!sessionStorage.getItem(OTP_VALUE_KEY)) {
      showOtpStatus("Send an OTP and verify your email before submitting.", true);
      emailInput?.focus();
    } else {
      showOtpStatus("Enter the OTP sent to your email and click Verify.", true);
      emailOtpInput?.focus();
    }

    return;
  }

  if (values.password !== values.confirmPassword) {
    showStatus(status, "Passwords do not match.", true);
    return;
  }

  const termsCheckbox = form.querySelector('input[name="termsAccepted"]');

  if (!termsCheckbox?.checked) {
    showStatus(
      status,
      "Please accept the Terms & Conditions and Privacy Policy.",
      true
    );
    return;
  }

  const requestBody = {
    name: values.name?.trim(),
    country: values.country,
    email,
    mobile: values.mobile?.replace(/\s+/g, "").trim(),
    creatorType: values.creatorType,
    category: values.category,
    password: values.password,
    confirmPassword: values.confirmPassword,
    emailVerificationToken,
    termsAccepted: true,
  };

  try {
    setLoading(submitButton, true);

    const data = await GicaApi.request("/api/register", {
      method: "POST",
      body: requestBody,
    });

    if (data?.status !== "success") {
      throw new Error(data?.message || "Registration failed.");
    }

    clearOtpStorage();

    if (data.token) {
      saveSession(data);
      showStatus(status, "Account created. Opening your Creator Panel…", false);

      setTimeout(() => {
        window.location.href = "creator-dashboard.html";
      }, 700);

      return;
    }

    showStatus(
      status,
      `Account created successfully. Your Creator ID is ${
        data.user?.creatorId || "ready"
      }. Opening login…`,
      false
    );

    setTimeout(() => {
      window.location.href = "login.html";
    }, 1000);
  } catch (error) {
    const message = error?.message || "Registration failed. Please try again.";

    if (message.toLowerCase().includes("verification expired")) {
      resetOtpVerification();
    }

    throw new Error(message);
  } finally {
    setLoading(submitButton, false);
  }
}

/* =========================================================
   CREATOR LOGIN
========================================================= */

async function loginCreator(values, status) {
  const email = normalizeEmail(values.email);
  const password = values.password;

  if (!email || !password) {
    showStatus(status, "Email and password are required.", true);
    return;
  }

  const data = await GicaApi.request("/api/login", {
    method: "POST",
    body: { email, password },
  });

  if (data?.status !== "success") {
    throw new Error(data?.message || "Incorrect email or password.");
  }

  if (!data.token) {
    throw new Error("Authentication token was not returned by the server.");
  }

  saveSession(data);
  showStatus(status, "Login successful. Opening your Creator Panel…", false);

  setTimeout(() => {
    window.location.href = "creator-dashboard.html";
  }, 600);
}

/* =========================================================
   PUBLIC INQUIRY
========================================================= */

async function submitInquiry(values) {
  const data = await GicaApi.request("/api/inquiries", {
    method: "POST",
    body: values,
  });

  if (data?.status !== "success") {
    throw new Error(data?.message || "Unable to submit inquiry.");
  }

  return data;
}

/* =========================================================
   SESSION
========================================================= */

function saveSession(data) {
  const session = {
    token: data.token,
    user: data.user || null,
    loggedInAt: new Date().toISOString(),
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

/* =========================================================
   STATUS
========================================================= */

function showStatus(element, message, isError = false) {
  if (!element) return;

  element.textContent = message || "";
  element.classList.toggle("error", Boolean(isError));
}

function showOtpStatus(message, isError = false) {
  if (!otpStatus) return;

  otpStatus.textContent = message || "";
  otpStatus.classList.toggle("error", Boolean(isError));
}

function clearStatus(element) {
  if (!element) return;

  element.textContent = "";
  element.classList.remove("error");
}

/* =========================================================
   LOADING
========================================================= */

function setLoading(button, isLoading) {
  if (!button) return;

  if (isLoading) {
    if (!button.dataset.originalText) {
      button.dataset.originalText = button.innerHTML;
    }

    button.disabled = true;
    button.innerHTML = "Please wait…";
    return;
  }

  button.disabled = false;

  if (button.dataset.originalText) {
    button.innerHTML = button.dataset.originalText;
    delete button.dataset.originalText;
  }
}

function setOtpLoading(button, loading, text) {
  if (!button) return;

  button.disabled = loading;
  button.textContent = text;
}
