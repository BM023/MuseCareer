# MuseCareer
<h3>Your Future. Powered by Insight.</h3>

MuseCareer is an AI-driven career guidance platform that analyzes a user’s CV, skills, qualifications, and interests to generate personalized career recommendations. By integrating a Node.js backend with the Gemini API and deploying the fully containerized system with Docker and Kubernetes, MuseCareer delivers intelligent, actionable insights for job seekers, graduates, and early-career professionals.

## 📷 Preview
<img width="1340" height="591" alt="WhatsApp Image 2025-11-25 at 08.44.29 (1)" src="/mnt/data/WhatsApp%20Image%202025-11-25%20at%2008.44.29%20(1).jpeg" />

## 💡 Why We Created MuseMind

Career guidance is often inaccessible, expensive, or too generic. Many young professionals are left wondering: “Which career path aligns with my skills, interests, and experience?”

MuseCareer solves this by transforming raw CV data into structured intelligence using AI. It empowers users with clear next steps, tailored recommendations, and a roadmap for career growth — all within seconds.

## ⚙️ How MuseCareer Works
1. User uploads a CV + enters interests.
2. CV is converted to text and processed by the backend.
3. The backend sends a structured prompt to the Gemini API.
4. AI generates:
<ul>
    <li>Skill breakdown</li>
    <li>Career recommendations</li>
    <li>Skill-gap analysis</li>
    <li>CV improvements</li>
</ul>
5. The frontend displays the results in a clean, readable interface.

## 🎨 Features
<h4>📄 CV Upload & Text Extraction</h4>
Upload your CV (PDF, DOCX, or TXT).
The backend converts your file to text and prepares it for AI processing.

<h4>🤖 AI-Powered Career Recommendations</h4>
Using the Gemini API, MuseCareer generates:
Best-fit career paths
Areas where you need to upskill
Suggested courses and certifications
Entry-level roles to explore
Tips on improving your CV
Where to seek mentors or networking opportunities

<h4>🧠 Skills Analysis</h4>
Breaks your CV into:
Technical skills
Soft skills
Tools & technologies
Domain knowledge

<h4>📉 Skills Gap Report</h4>
Identifies missing skills and offers:
Courses
Certifications
Practical improvement paths

<h4>📝 CV Improvement Suggestions</h4>
AI-powered feedback on:
ATS optimization
Formatting
Clarity and structure

<h4>🐳 Docker & Kubernetes Deployment</h4>
Fully containerized frontend and backend
Kubernetes-managed application with Deployment + Service (backend)
CI/CD automated using GitHub Actions

## ⛓ Tech Stack
<h4>Frontend</h4>
<ul>
    <li>HTML</li>
    <li>CSS</li>
    <li>JavaScript</li>
    <li>Responsive UI/UX</li>
    <li>File upload + base64 conversion</li>
</ul>

<h4>Backend</h4>
<ul>
    <li>Node.js</li>
    <li>Express.js</li>
    <li>Axios (API communication)</li>
    <li>Gemini API (AI model)</li>
</ul>

<h4>Containerization & DevOps</h4>
<ul>
    <li>Docker</li>
    <li>Docker Hub</li>
    <li>Kubernetes (Deployment + Service)</li>
    <li>GitHub Actions (CI/CD)</li>
    <li>YAML configuration</li>
    <li>GitHub for version control</li>
</ul>

## 📊 Project Structure
```
MuseCareer/
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js
│
├── backend/
│   ├── server.js
│   ├── gem-api.js
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
│
├── k8s/
│   ├── deployment.yaml
│   └── service.yaml
│
└── README.md
```

## 🌀 License
This project was created as part of a cloud engineering & AI development bootcamp.

## 🖇️ Links
<h4>🐳 Docker Deployment</h4>

Backend:
https://hub.docker.com/r/boikanyomz/musecareer-backend
Frontend:
https://hub.docker.com/r/boikanyomz/musecareer-frontend

<h4>☸ Kubernetes Deployment</h4>
http://4.253.89.75 

## 👩🏽‍💻 The Git Girls Team
| Member | Role | Responsibilities |
|---------|------|------------------|
| **Aobakwe Modillane** | DevOps & CI/CD Engineer | Kubernetes, Docker pipeline, deployment, debugging |
| **Boikanyo Maswi** | Scrum Master & Frontend Lead | UI design, debugging, frontend implementation, Docker, secrets management |
| **Luyanda Zuma** | AI Integration & Backend Dev | Express API, Gemini integration, prompt engineering, testing |

<h3>Made with 💜 by Git Girls.</h3> 
<em>Empowering careers through intelligent insight.</em>
