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
import cv2
import numpy as np

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

@app.post("/cv-analysis")
async def cv_analysis(file: UploadFile = File(...)):
    """Fast OpenCV-based analysis for color detection and anomaly spotting."""
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image data")

        # Resize for faster processing
        img = cv2.resize(img, (640, 480))
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

        # 1. Color Masking for Health Analysis
        # Green (Healthy)
        lower_green = np.array([35, 40, 40])
        upper_green = np.array([85, 255, 255])
        green_mask = cv2.inRange(hsv, lower_green, upper_green)
        green_pct = (cv2.countNonZero(green_mask) / (img.shape[0] * img.shape[1])) * 100

        # Yellow (Nitrogen deficiency / Yellowing)
        lower_yellow = np.array([20, 100, 100])
        upper_yellow = np.array([34, 255, 255])
        yellow_mask = cv2.inRange(hsv, lower_yellow, upper_yellow)
        yellow_pct = (cv2.countNonZero(yellow_mask) / (img.shape[0] * img.shape[1])) * 100

        # Brown (Drying / Disease spots)
        lower_brown = np.array([10, 50, 20])
        upper_brown = np.array([20, 255, 200])
        brown_mask = cv2.inRange(hsv, lower_brown, upper_brown)
        brown_pct = (cv2.countNonZero(brown_mask) / (img.shape[0] * img.shape[1])) * 100

        # 2. Pest / Spot Detection (Contour Analysis)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        edged = cv2.Canny(blurred, 50, 150)
        contours, _ = cv2.findContours(edged.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        pest_count = 0
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if 10 < area < 200:  # Potential pests or small spots
                pest_count += 1

        # 3. Plant Detection — bounding boxes around PLANT regions only
        # Use green as the primary plant indicator (plants are green)
        # Yellow/brown are secondary — only valid if near green regions
        kernel_lg = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (21, 21))
        kernel_sm = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))

        # Build plant mask: start with green, then include yellow/brown ONLY
        # where they overlap with dilated green (i.e., near a plant)
        green_dilated = cv2.dilate(green_mask, kernel_lg, iterations=2)
        plant_yellow = cv2.bitwise_and(yellow_mask, green_dilated)
        plant_brown = cv2.bitwise_and(brown_mask, green_dilated)

        plant_mask = green_mask | plant_yellow | plant_brown
        plant_mask = cv2.morphologyEx(plant_mask, cv2.MORPH_CLOSE, kernel_lg)
        plant_mask = cv2.morphologyEx(plant_mask, cv2.MORPH_OPEN, kernel_sm)

        plant_contours, _ = cv2.findContours(plant_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        h, w = img.shape[:2]
        total_pixels = h * w
        detections = []
        for cnt in plant_contours:
            area = cv2.contourArea(cnt)

            # Skip if too small (noise) or too large (entire frame)
            if area < 2000 or area > total_pixels * 0.85:
                continue

            x, y, bw, bh = cv2.boundingRect(cnt)

            # Skip very thin or very wide boxes (unlikely to be a plant)
            aspect = bw / bh if bh > 0 else 0
            if aspect > 5 or aspect < 0.15:
                continue

            # Measure how much GREEN is in this specific bounding box
            roi_green = green_mask[y:y+bh, x:x+bw]
            roi_yellow = yellow_mask[y:y+bh, x:x+bw]
            roi_brown = brown_mask[y:y+bh, x:x+bw]
            roi_area = bw * bh
            local_green = (cv2.countNonZero(roi_green) / roi_area) * 100 if roi_area else 0
            local_yellow = (cv2.countNonZero(roi_yellow) / roi_area) * 100 if roi_area else 0
            local_brown = (cv2.countNonZero(roi_brown) / roi_area) * 100 if roi_area else 0

            # Must have at least 15% green to be considered a plant
            if local_green < 15:
                continue

            label = "Healthy"
            if local_brown > 5:
                label = "Disease Spotted"
            elif local_yellow > 10:
                label = "Nitrogen Deficiency"

            detections.append({
                "x": round(x / w, 4),
                "y": round(y / h, 4),
                "w": round(bw / w, 4),
                "h": round(bh / h, 4),
                "label": label,
                "green_pct": round(local_green, 1),
                "yellow_pct": round(local_yellow, 1),
                "brown_pct": round(local_brown, 1),
            })

        # Sort by area (largest first) and cap at 8
        detections.sort(key=lambda d: d["w"] * d["h"], reverse=True)
        detections = detections[:8]

        # 4. Formulate Results
        status = "Healthy"
        anomalies = []
        
        if yellow_pct > 5:
            status = "Yellowing Detected"
            anomalies.append("Potential Nitrogen Deficiency")
        if brown_pct > 2:
            status = "Disease Spots Detected"
            anomalies.append("Fungal/Brown Spots")
        if pest_count > 15:
            anomalies.append("Potential Pest Activity")

        health_score = max(0, 100 - (yellow_pct * 5) - (brown_pct * 10))

        return {
            "health_score": round(health_score, 1),
            "status": status,
            "anomalies": anomalies,
            "detections": detections,
            "metrics": {
                "green_pct": round(green_pct, 2),
                "yellow_pct": round(yellow_pct, 2),
                "brown_pct": round(brown_pct, 2),
                "pest_indicators": pest_count
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"CV Analysis failed: {str(e)}")

# ─── Run ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
