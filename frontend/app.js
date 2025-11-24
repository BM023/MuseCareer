const BACKEND_ENDPOINT = "http://localhost:3000/prod";

document.addEventListener("DOMContentLoaded", () => {
  // DOM 
  const additionalInput = document.getElementById("additionalInfo");
  const cvFileInput = document.getElementById("cvFile");
  const submitBtn = document.getElementById("submitBtn");
  const resetBtn = document.getElementById("resetBtn");
  const resultsSection = document.getElementById("results");
  const summaryBox = document.getElementById("summaryBox");
  const carousel = document.getElementById("carousel");
  const recTitle = document.getElementById("recTitle");
  const recContent = document.getElementById("recContent");
  const pageCounter = document.getElementById("pageCounter");
  const nextRecBtn = document.getElementById("nextRec");

  // state
  let recommendations = [];
  let currentIndex = 0;
  let latestSummary = null;

  function showAlertLocal(msg, type = "info") {
    // type can be used to style later
    summaryBox.textContent = msg;
    resultsSection.classList.remove("hidden");
  }

  function resetAll() {
    if (additionalInput) additionalInput.value = "";
    if (cvFileInput) cvFileInput.value = "";
    recommendations = [];
    currentIndex = 0;
    latestSummary = null;
    if (summaryBox) summaryBox.textContent = "No results yet. Submit your CV to begin.";
    if (carousel) carousel.classList.add("hidden");
    if (resultsSection) resultsSection.classList.add("hidden");
  }

  async function readFileAsBase64(file) {
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  }

  // Health check helper: tries BACKEND_ENDPOINT's health endpoint
  async function checkBackendHealth() {
    try {
      // derive health URL: if endpoint ends with /prod, replace with /health; else append /health
      let healthUrl;
      try {
        const u = new URL(BACKEND_ENDPOINT);
        if (u.pathname.endsWith("/prod")) {
          u.pathname = u.pathname.replace(/\/prod$/, "/health");
          healthUrl = u.toString();
        } else {
          healthUrl = new URL("/health", u.origin).toString();
        }
      } catch (e) {
        // fallback: just append
        healthUrl = BACKEND_ENDPOINT.replace(/\/+$/, "") + "/health";
      }

      const resp = await fetch(healthUrl, { method: "GET", mode: "cors" });
      if (!resp.ok) {
        const body = await safeReadResponse(resp);
        return { ok: false, status: resp.status, body };
      }
      const body = await safeReadResponse(resp);
      return { ok: true, status: resp.status, body };
    } catch (err) {
      // Network-level failure (CORS, server not running, mixed content, offline)
      return { ok: false, networkError: true, message: err.message || String(err) };
    }
  }

  // Utility to safely read response as JSON or text
  async function safeReadResponse(resp) {
    const ct = resp.headers.get("content-type") || "";
    try {
      if (ct.includes("application/json")) {
        return await resp.json();
      } else {
        return await resp.text();
      }
    } catch (e) {
      try { return await resp.text(); } catch (_) { return "<unreadable body>"; }
    }
  }

  // Main call to backend with improved error messages
  async function callBackendForAnalysis({ fileDataUrl, fileType, extraText }) {
    const body = {
      contents: [
        {
          parts: [
            {
              text:
                `Analyze the following CV and user inputs to provide four detailed career recommendations and a summary. ` +
                `The user may be interested in these areas: '${extraText}'. Respond ONLY with JSON matching the schema.`
            },
            { inlineData: { mimeType: fileType, data: fileDataUrl } }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json"
      }
    };

    try {
      const resp = await fetch(BACKEND_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        mode: "cors", // helpful for clear CORS errors in some browsers
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        const body = await safeReadResponse(resp);
        throw new Error(`Backend returned ${resp.status}: ${typeof body === "string" ? body : JSON.stringify(body)}`);
      }

      // response OK
      const ct = resp.headers.get("content-type") || "";
      let data;
      if (ct.includes("application/json")) {
        data = await resp.json();
      } else {
        data = await resp.text();
      }
      return data;

    } catch (err) {
      // Rethrow with helpful hint
      if (err instanceof TypeError && err.message === "Failed to fetch") {
        throw new Error(
          "Network error: 'Failed to fetch'. Possible causes: backend not running, CORS blocked, mixed-content (http page calling https or vice-versa), or you're opening the HTML as a file:// URL. See browser console/network tab."
        );
      }
      throw err;
    }
  }

  function renderRecommendations() {
    if (!recommendations || recommendations.length === 0) {
      if (carousel) carousel.classList.add("hidden");
      return;
    }
    if (carousel) carousel.classList.remove("hidden");
    if (resultsSection) resultsSection.classList.remove("hidden");

    const current = recommendations[currentIndex] || {};
    if (recTitle) recTitle.textContent = current.title || `Recommendation ${currentIndex + 1}`;
    if (recContent) recContent.textContent = current.page_content || "(no content)";
    if (pageCounter) pageCounter.textContent = `${currentIndex + 1} / ${recommendations.length}`;
  }

  if (nextRecBtn) {
    nextRecBtn.addEventListener("click", () => {
      if (recommendations.length === 0) return;
      currentIndex = (currentIndex + 1) % recommendations.length;
      renderRecommendations();
    });
  }

  resetBtn.addEventListener("click", () => {
    resetAll();
    showAlertLocal("Page reset", "success");
  });

  submitBtn.addEventListener("click", async () => {
    const file = cvFileInput?.files?.[0];
    const extra = additionalInput?.value || "";

    if (!file) {
      showAlertLocal("Please upload a CV file.", "error");
      return;
    }

    // Pre-flight health check
    showAlertLocal("Checking backend connectivity...");
    submitBtn.disabled = true;
    const prevText = submitBtn.textContent;
    submitBtn.textContent = "Checking...";

    const health = await checkBackendHealth();
    if (!health.ok) {
      submitBtn.disabled = false;
      submitBtn.textContent = prevText || "Submit";
      console.error("Backend health check failed:", health);
      if (health.networkError) {
        showAlertLocal(`Backend unreachable: ${health.message}. Check server, CORS, and that the URL is correct.`, "error");
      } else {
        showAlertLocal(`Backend health check returned status ${health.status}: ${JSON.stringify(health.body)}`, "error");
      }
      return;
    }

    // proceed
    submitBtn.textContent = "Submitting...";
    showAlertLocal("Uploading CV and analyzing — this may take a few seconds...");

    try {
      const fileDataUrl = await readFileAsBase64(file);
      const result = await callBackendForAnalysis({
        fileDataUrl,
        fileType: file.type || "application/octet-stream",
        extraText: extra,
      });

      let payload = result;
      if (typeof result === "string") {
        try { payload = JSON.parse(result); } catch (e) { /* keep as string */ }
      }
      // normalize common wrappers
      if ((!payload || !payload.recommendations) && payload?.body && payload.body.recommendations) {
        payload = payload.body;
      } else if ((!payload || !payload.recommendations) && payload?.data && payload.data.recommendations) {
        payload = payload.data;
      }

      if (!payload || !payload.recommendations) {
        console.error("Raw backend response (not usable):", result);
        throw new Error("Invalid response format from backend. See console for raw response.");
      }

      latestSummary = payload.summary || "No summary returned.";
      recommendations = payload.recommendations || [];

      summaryBox.textContent = latestSummary;
      currentIndex = 0;
      renderRecommendations();

      showAlertLocal("Recommendations ready", "success");
    } catch (err) {
      console.error("Analysis error:", err);
      showAlertLocal("Error during analysis: " + (err.message || err), "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = prevText || "Submit";
    }
  });

  // initial state
  resetAll();
});
