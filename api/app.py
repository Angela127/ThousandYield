"""
ThousandYield — Extended Plant Analysis API
=============================================
FastAPI server using Google Vertex AI (Gemini) for comprehensive plant analysis.

Endpoints:
    POST /predict  — Upload a plant image, get comprehensive analysis
    GET  /health   — Health check
"""

import os
import io
import json
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

import vertexai
from vertexai.generative_models import GenerativeModel, Part

# ─── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(BASE_DIR)
CREDENTIALS_PATH = os.path.join(PROJECT_DIR, "credentials", "google.json")

# ─── App Setup ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="ThousandYield Plant Analysis API",
    description="AI-powered plant analysis using Gemini via Vertex AI",
    version="1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Load model at startup ────────────────────────────────────────────────────
gemini_model = None

@app.on_event("startup")
async def setup_gemini():
    global gemini_model
    
    if not os.path.exists(CREDENTIALS_PATH):
        print(f"WARNING: Credentials not found at {CREDENTIALS_PATH}")
        return

    try:
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = CREDENTIALS_PATH
        with open(CREDENTIALS_PATH, "r") as f:
            cred_data = json.load(f)
            project_id = cred_data.get("project_id")
        
        vertexai.init(project=project_id, location="us-central1")
        gemini_model = GenerativeModel("gemini-2.5-flash")
        print(f"Successfully initialized Vertex AI for project: {project_id}")
    except Exception as e:
        print(f"Failed to initialize Vertex AI: {e}")

# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "gemini_loaded": gemini_model is not None,
    }

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """Upload a plant image and get disease, growth, and anomaly analysis."""
    if gemini_model is None:
        raise HTTPException(
            status_code=503,
            detail="Gemini model is not initialized. Check Vertex AI credentials.",
        )

    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {file.content_type}. Please upload an image.",
        )

    try:
        image_bytes = await file.read()
        image_part = Part.from_data(image_bytes, mime_type=file.content_type)
        
        prompt = """
        Analyze this plant image. Return a JSON object with exactly these fields:
        - "disease_status": Name of the disease (e.g., 'Tomato — Early Blight') or "Healthy".
        - "disease_confidence": A float from 0.0 to 1.0 representing your confidence in the disease status.
        - "growth_stage": One of [Seedling, Vegetative, Flowering, Fruiting, Unknown].
        - "anomaly": One of [Normal, Fallen Plant, Leaf Damage, Unusual Color, Other].
        - "reasoning": A brief 1-2 sentence explanation of your findings.
        
        Return ONLY a valid JSON object. Do not include markdown formatting like ```json.
        """

        response = gemini_model.generate_content(
            [image_part, prompt],
            generation_config={"response_mime_type": "application/json"}
        )
        
        response_text = response.text.strip()
        if response_text.startswith("```json"):
            response_text = response_text.replace("```json", "").replace("```", "").strip()
            
        result = json.loads(response_text)
        
        # Add is_healthy helper field for frontend compatibility
        is_healthy = "healthy" in str(result.get("disease_status", "")).lower()
        result["is_healthy"] = is_healthy
        
        # Set prediction field to disease_status for backwards compatibility with UI
        result["prediction"] = result.get("disease_status", "Unknown")
        result["confidence"] = result.get("disease_confidence", 0.0)
        
        # We don't have top 3 anymore with Gemini, but frontend expects it
        result["top_3"] = []

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

# ─── Run ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
