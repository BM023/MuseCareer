// IMPORTANT: replace BACKEND_ENDPOINT and LLM_API_KEY (if you call LLM directly)
// The original Appsmith file shows endpoints & payload templates (see MuseCareer.json).

const BACKEND_ENDPOINT = "https://your-backend.example.com/prod"; // placeholder
const LLM_GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/YOUR_MODEL:generateContent"; // optional
const GEMINI_API_KEY = ""; // to call the Google Generative API directly

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

let recommendations = [];
let currentIndex = 0;
let latestSummary = null;

function showAlertLocal(msg, type="info"){

  summaryBox.textContent = `${msg}`;
  resultsSection.classList.remove("hidden");
}

function resetAll(){
  additionalInput.value = "";
  cvFileInput.value = "";
  recommendations = [];
  currentIndex = 0;
  latestSummary = null;
  summaryBox.textContent = "No results yet. Submit your CV to begin.";
  carousel.classList.add("hidden");
  resultsSection.classList.add("hidden");
}

async function readFileAsBase64(file){
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result;
      resolve(res);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function callBackendForAnalysis({ fileDataUrl, fileType, extraText }){

  const body = {
    contents: [
      { parts: [
        { text: `Analyze the following CV and user inputs to provide four detailed career recommendations and a summary. The user may be interested in these areas and has these enrollmentsand/or interests: '${extraText}'. Respond ONLY with JSON matching the schema.` },
        { inlineData: { mimeType: fileType, data: fileDataUrl } }
      ]}
    ],
    config: {
      responseMimeType: "application/json"
    }
  };

  // If you have a custom API that your Appsmith app used: use BACKEND_ENDPOINT
  // This sample sends to BACKEND_ENDPOINT; set to the API Gateway you used.
  const url = BACKEND_ENDPOINT; // e.g. https://d7in6j9n62.execute-api.us-east-1.amazonaws.com/prod (Appsmith endpoint)
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Backend error ${resp.status}: ${txt}`);
  }
  return resp.json();
}

function renderRecommendations(){
  if (!recommendations || recommendations.length === 0){
    carousel.classList.add("hidden");
    return;
  }
  carousel.classList.remove("hidden");
  resultsSection.classList.remove("hidden");
  const current = recommendations[currentIndex];
  recTitle.textContent = current.title || `Recommendation ${currentIndex+1}`;
  recContent.textContent = current.page_content || "(no content)";
  pageCounter.textContent = `${currentIndex+1} / ${recommendations.length}`;
}

nextRecBtn.addEventListener("click", ()=>{
  if (recommendations.length === 0) return;
  currentIndex = (currentIndex + 1) % recommendations.length;
  renderRecommendations();
});

resetBtn.addEventListener("click", () => {
  resetAll();
  showAlertLocal("Page reset", "success");
});

submitBtn.addEventListener("click", async () => {
  const file = cvFileInput.files[0];
  const extra = additionalInput.value || "";
  if (!file) {
    showAlertLocal("Please upload a CV file.", "error");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting...";

  try {
    const fileDataUrl = await readFileAsBase64(file);
    const result = await callBackendForAnalysis({
      fileDataUrl,
      fileType: file.type || "application/octet-stream",
      extraText: extra,
    });


    let payload = result;
    if (typeof result === "string") {
      try { payload = JSON.parse(result); } catch(e){ }
    }
    if (!payload || !payload.recommendations) {
      if (payload.body && payload.body.recommendations) payload = payload.body;
      else if (payload.data && payload.data.recommendations) payload = payload.data;
    }

    latestSummary = payload.summary || payload?.body?.summary || "No summary returned.";
    recommendations = payload.recommendations || payload?.body?.recommendations || [];

    summaryBox.textContent = latestSummary;
    resultsSection.classList.remove("hidden");

    currentIndex = 0;
    renderRecommendations();

    showAlertLocal("Recommendations ready", "success");
  } catch (err) {
    console.error(err);
    showAlertLocal("Error during analysis: " + (err.message || err), "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit";
  }
});

resetAll();
