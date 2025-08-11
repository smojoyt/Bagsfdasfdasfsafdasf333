"use strict";

document.addEventListener("DOMContentLoaded", () => {
  // ---------- Constants
  const ENDPOINT = "https://hook.us2.make.com/mebf3tl39n3o3gx11ywaeta6f7eo1yja";
  const RATE_LIMIT_MS = 15_000;
  const FETCH_TIMEOUT_MS = 12_000;

  // Wallet endpoints (replace with your real ones when ready)
  // Apple Wallet: host a .pkpass that accepts ?code=
  const APPLE_WALLET_URL = "/wallet/kk-coupon.pkpass";
  // Google Wallet: typically requires a JWT; route this to your server that returns the GPay Save URL
  const GOOGLE_WALLET_URL = "/wallet/gpay?code=";

  // ---------- DOM
  const form = document.getElementById("couponForm");
  const statusRegion = document.getElementById("formStatus");
  const submitBtn = document.getElementById("submitBtn");
  const btnText = document.getElementById("btnText");
  const btnSpinner = document.getElementById("btnSpinner");
  const messageBox = document.getElementById("couponMessage");
  const messageText = messageBox?.querySelector("p");
  const useNowBtn = messageBox?.querySelector("a");
  const overlay = document.getElementById("loadingOverlay");

  if (!form || !submitBtn || !btnText || !btnSpinner || !overlay || !messageBox || !messageText || !useNowBtn || !statusRegion) {
    console.warn("[signup] Missing required DOM nodes — aborting.");
    return;
  }

  // ---------- Utils
  const now = () => Date.now();
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const digits = (s) => String(s || "").replace(/\D+/g, "");
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  const sanitize = (s) => String(s ?? "").replace(/[<>]/g, "");
  const normalizeSpace = (s) => sanitize(s).trim().replace(/\s+/g, " ");
  const normalizeEmail = (email) => {
    if (!email) return "";
    let e = String(email).trim().toLowerCase();
    e = e.replace("@gamil.", "@gmail.").replace("@gmial.", "@gmail.");
    return e;
  };
  const formatPhonePretty = (value) => {
    const d = digits(value).slice(0, 11);
    const n = d.startsWith("1") ? d.slice(1) : d;
    if (n.length <= 3) return n;
    if (n.length <= 6) return `(${n.slice(0,3)}) ${n.slice(3)}`;
    return `(${n.slice(0,3)}) ${n.slice(3,6)}-${n.slice(6,10)}`;
  };
  const normalizePhone = (value) => {
    const d = digits(value);
    if (d.length === 10) return "1" + d;
    if (d.length === 11 && d.startsWith("1")) return d;
    return d;
  };
  const formatDate = (val) => {
    const d = new Date(val);
    return isNaN(d) ? String(val || "") : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  };

  // ---------- A11y status region (errors visible; success SR-only)
  const speak = (msg, { visual = false, focus = true, tone = "info" } = {}) => {
    statusRegion.textContent = msg;
    statusRegion.dataset.type = tone;
    statusRegion.classList.toggle("sr-only", !visual);
    if (focus) statusRegion.focus({ preventScroll: true });
  };

  // ---------- Busy state
  const setBusy = (isBusy) => {
    form.setAttribute("aria-busy", String(isBusy));
    submitBtn.disabled = isBusy;
    btnSpinner.style.visibility = isBusy ? "visible" : "hidden";
    btnText.textContent = isBusy ? "Processing..." : "Claim My Coupon";
    overlay.classList.toggle("hidden", !isBusy);
    document.documentElement.style.overflow = isBusy ? "hidden" : "";
  };

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !overlay.classList.contains("hidden")) setBusy(false);
  });

  // ---------- Errors
  const clearErrors = () => {
    form.querySelectorAll("[aria-invalid='true']").forEach(el => el.setAttribute("aria-invalid", "false"));
    form.querySelectorAll("[data-error-for]").forEach(el => { el.textContent = ""; el.classList.add("hidden"); });
    form.querySelectorAll(".border-red-500").forEach(el => el.classList.remove("border-red-500"));
    form.querySelectorAll(".focus\\:ring-red-500").forEach(el => el.classList.remove("focus:ring-red-500"));
  };
  const setFieldError = (id, msg) => {
    const input = document.getElementById(id);
    const err = form.querySelector(`[data-error-for="${id}"]`);
    if (input) {
      input.setAttribute("aria-invalid", "true");
      input.classList.add("border-red-500");
      input.classList.add("focus:ring-red-500");
    }
    if (err) { err.textContent = msg; err.classList.remove("hidden"); }
  };

  // ---------- Field validation
  const validateField = (id) => {
    const el = document.getElementById(id);
    if (!el) return true;
    const val = (el.value || "").trim();

    if (id === "firstName") {
      if (!val) { setFieldError(id, "First name is required."); return false; }
      el.value = normalizeSpace(val);
      return true;
    }
    if (id === "lastName") {
      if (!val) { setFieldError(id, "Last name is required."); return false; }
      el.value = normalizeSpace(val);
      return true;
    }
    if (id === "email") {
      const email = normalizeEmail(val);
      if (!emailRegex.test(email)) { setFieldError(id, "Enter a valid email address."); return false; }
      el.value = email;
      return true;
    }
    if (id === "phone") {
      const d = digits(val);
      if (d.length < 10) { setFieldError(id, "Enter a valid US phone number."); return false; }
      el.value = formatPhonePretty(val);
      return true;
    }
    if (id === "smsConsent") {
      if (!el.checked) { setFieldError(id, "SMS consent is required."); return false; }
      return true;
    }
    if (id === "emailConsent") {
      if (!el.checked) { setFieldError(id, "Email consent is required."); return false; }
      return true;
    }
    return true;
  };

  const validateAll = () => {
    clearErrors();
    const order = ["firstName", "lastName", "email", "phone", "smsConsent", "emailConsent"];
    let ok = true, firstBad = null;
    for (const id of order) {
      const good = validateField(id);
      if (!good && !firstBad) firstBad = document.getElementById(id);
      ok = ok && good;
    }
    if (!ok && firstBad) firstBad.focus();
    return ok;
  };

  let vTimer = null;
  const debouncedValidate = (id) => {
    clearTimeout(vTimer);
    vTimer = setTimeout(() => validateField(id), 180);
  };

  // Live feedback
  form.addEventListener("input", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    const id = t.getAttribute("id");
    if (id === "phone") t.value = formatPhonePretty(t.value);
    if (id) debouncedValidate(id);
  });
  form.addEventListener("blur", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    const id = t.getAttribute("id");
    if (id) validateField(id);
  }, true);
  form.addEventListener("paste", (e) => {
    const t = e.target;
    if (t && t.id === "phone") {
      e.preventDefault();
      const txt = (e.clipboardData?.getData("text") || "");
      t.value = formatPhonePretty(txt);
      debouncedValidate("phone");
    }
  });

  // ---------- Serialization
  const serializeForm = () => {
    const fd = new FormData(form);
    const obj = {};
    for (const [k, v] of fd.entries()) obj[k] = typeof v === "string" ? normalizeSpace(v) : v;

    // Honeypot
    if (obj.company) {
      obj.__honeypot = obj.company;
      delete obj.company;
    }

    // Normalize
    obj.email = normalizeEmail(obj.email);
    obj.phone = normalizePhone(obj.phone);
    obj.smsConsent = !!form.querySelector("#smsConsent")?.checked;
    obj.emailConsent = !!form.querySelector("#emailConsent")?.checked;

    // UTM / context
    const usp = new URLSearchParams(location.search);
    ["utm_source","utm_medium","utm_campaign","utm_content","utm_term"].forEach(k => {
      const v = usp.get(k);
      if (v) obj[k] = v;
    });
    obj.referrer = document.referrer || "";
    obj.path = location.pathname + location.search;
    obj.tzOffsetMin = new Date().getTimezoneOffset();
    obj.ts = new Date().toISOString();

    return obj;
  };

  // ---------- HTTP helpers
  const withTimeout = (ms) => {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), ms);
    return { signal: ctrl.signal, cancel: () => clearTimeout(id) };
  };
  const postJSON = async (url, payload) => {
    const reqId = (crypto?.randomUUID?.() || Math.random().toString(36).slice(2));
    const { signal, cancel } = withTimeout(FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-Request-ID": reqId
        },
        signal,
        body: JSON.stringify(payload)
      });
      cancel();
      return res;
    } catch (e) {
      cancel();
      throw e;
    }
  };

  // ---------- Confetti (5s)
  const confetti = (durationMs = 5000) => {
    if (prefersReducedMotion) return;
    const c = document.createElement("canvas");
    const ctx = c.getContext("2d");
    const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const resize = () => {
      c.width  = Math.floor(window.innerWidth  * DPR);
      c.height = Math.floor(window.innerHeight * DPR);
      c.style.width  = "100vw";
      c.style.height = "100vh";
    };
    resize();
    c.style.position = "fixed";
    c.style.inset = "0";
    c.style.zIndex = "60";
    c.style.pointerEvents = "none";
    document.body.appendChild(c);
    window.addEventListener("resize", resize);

    const baseCount = (Math.min(window.innerWidth, window.innerHeight) < 640) ? 90 : 140;
    const rand = (a, b) => a + Math.random() * (b - a);
    const pieces = Array.from({ length: baseCount }, () => ({
      x: rand(0, c.width),
      y: rand(-c.height * 0.2, -10),
      r: rand(2 * DPR, 4 * DPR),
      vx: rand(-1 * DPR, 1 * DPR),
      vy: rand(2 * DPR, 4 * DPR),
      spin: rand(-0.2, 0.2),
      ang: rand(0, Math.PI * 2),
      hue: rand(0, 360),
    }));

    const start = performance.now();
    const end = start + durationMs;
    const tailMs = 250;

    const step = (t) => {
      const progress = Math.min(1, (t - start) / durationMs);
      ctx.clearRect(0, 0, c.width, c.height);
      for (const p of pieces) {
        p.vy += 0.03 * DPR;
        p.vx *= 0.995;
        p.x += p.vx;
        p.y += p.vy;
        p.ang += p.spin;
        if (p.x < -10 * DPR) p.x = c.width + 10 * DPR;
        if (p.x > c.width + 10 * DPR) p.x = -10 * DPR;
        const alpha = 1 - Math.max(0, progress - 0.8) / 0.2;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.ang);
        ctx.fillStyle = `hsla(${p.hue}, 90%, 60%, ${alpha})`;
        ctx.fillRect(-p.r, -p.r * 0.5, p.r * 2, p.r);
        ctx.restore();
      }
      if (t < end + tailMs) requestAnimationFrame(step);
      else { window.removeEventListener("resize", resize); c.remove(); }
    };
    requestAnimationFrame(step);
  };

  // ---------- Coupon actions (coupon-stub UI + copy; wallet hidden for now)
const injectCouponActions = (code) => {
  // remove any previous UI
  const old = document.getElementById("couponActions");
  if (old) old.remove();

  const actions = document.createElement("div");
  actions.id = "couponActions";
  actions.className = "mt-5 flex flex-col items-center gap-4";

  // Coupon block (dashed border)
  const coupon = document.createElement("div");
  coupon.className = [
    "relative inline-flex items-center gap-3",
    "border-2 border-black border-dashed",
    "px-4 py-2 bg-white select-all"
  ].join(" ");

  const codeEl = document.createElement("code");
  codeEl.id = "couponCodeText";
  codeEl.className = "font-mono tracking-wider text-lg text-black";
  codeEl.textContent = code || "";

  const copyBtn = document.createElement("button");
  copyBtn.id = "copyCodeBtn";
  copyBtn.type = "button";
  copyBtn.className = "px-3 py-1 bg-black text-white font-medium";
  copyBtn.textContent = "Copy";

  // tiny “Copied” toast
  const copied = document.createElement("span");
  copied.id = "copyToast";
  copied.className = "text-xs text-green-700 opacity-0 transition-opacity duration-200";
  copied.textContent = "Copied";

  coupon.append(codeEl, copyBtn);

  // Helper row (copy state text lives here)
  const helperRow = document.createElement("div");
  helperRow.className = "h-4 flex items-center justify-center";
  helperRow.appendChild(copied);

  actions.append(coupon, helperRow);

  // Insert before the Browse button
  useNowBtn.before(actions);

  // Wire copy
  copyBtn.addEventListener("click", async () => {
    const txt = codeEl.textContent || "";
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(txt);
      else {
        const ta = document.createElement("textarea");
        ta.value = txt; document.body.appendChild(ta);
        ta.select(); document.execCommand("copy"); ta.remove();
      }
      // show toast briefly
      copied.style.opacity = "1";
      setTimeout(() => (copied.style.opacity = "0"), 1200);
    } catch (err) {
      console.warn("[signup] clipboard failed", err);
    }
  });
};


  // ---------- Submit flow
  let submitting = false;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!navigator.onLine) {
      speak("You appear to be offline. Please check your connection and try again.", { visual: true, tone: "error" });
      return;
    }
    if (!validateAll()) {
      speak("Please fix the highlighted fields.", { visual: true, tone: "error" });
      return;
    }
    const hp = (form.querySelector("#company")?.value || "").trim();
    if (hp) {
      console.warn("[signup] Honeypot triggered; dropping.");
      speak("Submission failed. Please try again.", { visual: true, tone: "error" });
      return;
    }

    const emailKey = "kk_signup_last_" + (normalizeEmail(document.getElementById("email")?.value) || "anon");
    const last = Number(localStorage.getItem(emailKey) || 0);
    if (now() - last < RATE_LIMIT_MS) {
      speak("Please wait a moment before submitting again.", { visual: true, tone: "error" });
      return;
    }

    submitting = true;
    setBusy(true);

    const payload = serializeForm();

    // 1st try
    let res;
    try {
      res = await postJSON(ENDPOINT, payload);
    } catch (err) {
      console.warn("[signup] first attempt failed:", err);
      await new Promise(r => setTimeout(r, 900));
      try {
        res = await postJSON(ENDPOINT, payload);
      } catch (err2) {
        console.error("[signup] retry failed:", err2);
        setBusy(false);
        submitting = false;
        speak("Network error. Please try again.", { visual: true, tone: "error" });
        return;
      }
    }

    localStorage.setItem(emailKey, String(now()));

    try {
      if (!res.ok) {
        console.error("[signup] HTTP error:", res.status, res.statusText);
        speak("Something went wrong. Please try again.", { visual: true, tone: "error" });
      } else {
        let json;
        try { json = await res.json(); }
        catch { json = { status: "new", code: await res.text(), expires: "" }; }

        const { status, code, expires, message } = json || {};

        form.style.display = "none";
        messageBox.classList.remove("hidden");

        // Reset message area
        messageText.innerHTML = "";

        if (status === "used") {
          messageText.insertAdjacentHTML("beforeend",
            `<span class="block text-lg font-semibold text-red-600">You’ve used your coupon!</span>
             <span class="text-sm text-gray-700">Your code ${code || ""} has already been redeemed.</span>`);
          useNowBtn.classList.remove("hidden");
          // Still allow copy so they can keep the code, but hide wallet
          if (code) injectCouponActions(code, { enableWallet: false });
        } else if (status === "expired") {
          messageText.insertAdjacentHTML("beforeend",
            `<span class="block text-lg font-semibold text-red-600">Your previous coupon has expired.</span>
             <span class="text-sm text-gray-700">Code ${code || ""} expired on ${formatDate(expires)}.</span>`);
          useNowBtn.classList.add("hidden");
        } else if (status === "active") {
          messageText.insertAdjacentHTML("beforeend",
            `<span class="block text-lg font-semibold text-green-700">🎉 Your coupon has already been claimed!</span>
             <span class="text-sm text-gray-700">Your code is: ${code || ""} and expires ${formatDate(expires)}.</span>`);
          useNowBtn.classList.remove("hidden");
          if (code) injectCouponActions(code, { enableWallet: true });
        } else if (status === "new") {
          messageText.insertAdjacentHTML("beforeend",
            `<span class="block text-lg font-semibold text-green-700">🎉 Welcome! Your coupon has been created!</span>
             <span class="text-sm text-gray-700">Your code is: ${code || ""} and expires on ${formatDate(expires)}.</span>`);
          useNowBtn.classList.remove("hidden");
          if (code) injectCouponActions(code, { enableWallet: true });
        } else {
          messageText.textContent = message || "Something unexpected happened.";
          useNowBtn.classList.add("hidden");
        }

        if (code) {
          try {
            const url = new URL(useNowBtn.href, location.origin);
            url.searchParams.set("coupon", code);
            useNowBtn.href = url.toString();
          } catch {}
        }

        // Confetti for happy paths
        if (status === "active" || status === "new") confetti(5000);

        // SR-only success (no visible "Submission complete.")
        speak("Submission complete.", { visual: false, tone: "info" });

        messageBox.setAttribute("tabindex", "-1");
        messageBox.focus({ preventScroll: true });
      }
    } catch (err) {
      console.error("[signup] response handling error:", err);
      speak("Something went wrong. Please try again.", { visual: true, tone: "error" });
    } finally {
      setBusy(false);
      submitting = false;
    }
  });
});
