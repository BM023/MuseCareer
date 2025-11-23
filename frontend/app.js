const BACKEND_ENDPOINT = "http://localhost:3000/prod";

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

function showAlertLocal(msg, type="info"){
  summaryBox.textContent = msg;
  resultsSection.classList.remove("hidden");
}

function resetAll(){
  additionalInput.value = "";
  cvFileInput.value = "";
  recommendations = [];
  currentIndex = 0;
  latestSummary = null;
  summaryBox.textContent = "No results yet — submit your CV to begin.";
  carousel.classList.add("hidden");
  resultsSection.classList.add("hidden");
}

// read file as Base64
async function readFileAsBase64(file){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// render carousel
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

// events
nextRecBtn.addEventListener("click", () => {
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

    const payload = {
      contents: [
        {
          parts: [
            { text: extra },
            { inlineData: { mimeType: file.type || "application/octet-stream", data: fileDataUrl } }
          ]
        }
      ],
      config: { responseMimeType: "application/json" }
    };

    const resp = await fetch(BACKEND_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(`Backend error ${resp.status}: ${txt}`);
    }

    const result = await resp.json();

    latestSummary = result.summary || "No summary returned.";
    recommendations = Array.isArray(result.recommendations) ? result.recommendations : [];

    // show summary and recs
    summaryBox.textContent = latestSummary;
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

// init
resetAll();
