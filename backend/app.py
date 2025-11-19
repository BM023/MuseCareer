from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import google.generativeai as genai
import PyPDF2
import docx
from dotenv import load_dotenv
from io import BytesIO
from typing import Dict
import base64

load_dotenv()

app = FastAPI(title="Career Recommendation API")

# CORS middleware - Allow Appsmith to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify Appsmith domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini API
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-1.5-pro')

def extract_text_from_pdf(file_content):
    """Extract text from PDF"""
    try:
        pdf_reader = PyPDF2.PdfReader(file_content)
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading PDF: {str(e)}")

def extract_text_from_docx(file_content):
    """Extract text from DOCX"""
    try:
        doc = docx.Document(file_content)
        text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        return text
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading DOCX: {str(e)}")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Career Recommendation API",
        "version": "1.0",
        "endpoints": {
            "/health": "Health check",
            "/analyze-cv": "POST - Analyze CV file",
            "/analyze-cv-base64": "POST - Analyze CV from base64"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Test Gemini API connection
        test_response = model.generate_content("Hello")
        api_status = "connected" if test_response else "disconnected"
    except:
        api_status = "error"
    
    return {
        "status": "healthy",
        "model": "gemini-1.5-pro",
        "api_status": api_status
    }

@app.post("/analyze-cv")
async def analyze_cv(file: UploadFile = File(...)):
    """Analyze CV file and provide career recommendations"""
    
    try:
        # Validate file type
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
        
        file_ext = file.filename.lower().split('.')[-1]
        if file_ext not in ['pdf', 'docx', 'txt']:
            raise HTTPException(
                status_code=400, 
                detail="Unsupported file format. Please upload PDF, DOCX, or TXT"
            )
        
        # Read file content
        file_content = await file.read()
        
        # Extract text based on file type
        if file_ext == 'pdf':
            cv_text = extract_text_from_pdf(BytesIO(file_content))
        elif file_ext == 'docx':
            cv_text = extract_text_from_docx(BytesIO(file_content))
        else:  # txt
            cv_text = file_content.decode('utf-8')
        
        # Validate extracted text
        if not cv_text or len(cv_text.strip()) < 50:
            raise HTTPException(
                status_code=400, 
                detail="Could not extract enough text from the CV. Please ensure the file contains readable text."
            )
        
        # Analyze with Gemini
        analysis = await analyze_cv_text(cv_text)
        
        return {
            "success": True,
            "filename": file.filename,
            "analysis": analysis,
            "model": "gemini-1.5-pro"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error during analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@app.post("/analyze-cv-base64")
async def analyze_cv_base64(data: Dict):
    """Analyze CV from base64 encoded file (for Appsmith file picker)"""
    
    try:
        # Extract data from Appsmith file picker format
        file_data = data.get("file")
        if not file_data:
            raise HTTPException(status_code=400, detail="No file data provided")
        
        # Appsmith sends file as base64
        filename = file_data.get("name", "document")
        file_content_base64 = file_data.get("data", "")
        
        # Remove data URL prefix if present
        if "," in file_content_base64:
            file_content_base64 = file_content_base64.split(",")[1]
        
        # Decode base64
        file_content = base64.b64decode(file_content_base64)
        
        # Determine file type
        file_ext = filename.lower().split('.')[-1]
        if file_ext not in ['pdf', 'docx', 'txt']:
            raise HTTPException(
                status_code=400, 
                detail="Unsupported file format. Please upload PDF, DOCX, or TXT"
            )
        
        # Extract text
        if file_ext == 'pdf':
            cv_text = extract_text_from_pdf(BytesIO(file_content))
        elif file_ext == 'docx':
            cv_text = extract_text_from_docx(BytesIO(file_content))
        else:  # txt
            cv_text = file_content.decode('utf-8')
        
        # Validate extracted text
        if not cv_text or len(cv_text.strip()) < 50:
            raise HTTPException(
                status_code=400, 
                detail="Could not extract enough text from the CV."
            )
        
        # Analyze with Gemini
        analysis = await analyze_cv_text(cv_text)
        
        return {
            "success": True,
            "filename": filename,
            "analysis": analysis,
            "model": "gemini-1.5-pro"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error during analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

async def analyze_cv_text(cv_text: str) -> str:
    """Analyze CV text using Gemini API"""
    
    prompt = f"""You are an expert career counselor and CV reviewer. Analyze this CV/resume and provide comprehensive, structured feedback.

CV Content:
{cv_text}

Please provide a detailed analysis with the following sections. Use clear headers and formatting:

## 📊 SKILLS SUMMARY
List and categorize the key skills identified:
- Technical Skills:
- Soft Skills:
- Tools & Technologies:
- Languages:

## 📈 EXPERIENCE LEVEL
Assess the candidate's level: Junior (0-2 years), Mid-level (3-5 years), Senior (6-10 years), or Executive (10+ years)
Provide reasoning for your assessment.

## 🎯 CAREER RECOMMENDATIONS
Suggest 3-5 specific career paths or roles that match their profile. For each:
1. **[Job Title]**
   - Why it's a good fit
   - Typical salary range
   - Growth potential
   - Required qualifications

## 💡 CV IMPROVEMENT FEEDBACK
### Strengths:
- What's working well (list 3-5 points)

### Areas for Improvement:
- What's missing or unclear (list 3-5 points)
- Formatting suggestions
- Content recommendations
- Keywords to add for ATS systems

## 🔧 SKILLS GAP ANALYSIS
Identify 3-5 skills they should develop:
1. **[Skill Name]**
   - Why it's important
   - How to acquire it
   - Estimated time to learn

## 🚀 30-DAY ACTION PLAN
Week 1:
- [Specific action]

Week 2:
- [Specific action]

Week 3:
- [Specific action]

Week 4:
- [Specific action]

## 📝 SUMMARY
Provide a brief 2-3 sentence summary of the candidate's profile and potential.

Be specific, encouraging, and constructive in your feedback."""

    try:
        response = model.generate_content(prompt)
        
        if not response or not response.text:
            raise Exception("AI service returned no response")
        
        return response.text
        
    except Exception as e:
        raise Exception(f"Gemini API error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)