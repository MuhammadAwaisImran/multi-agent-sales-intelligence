from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from crew import PitchCrew

app = FastAPI(title="B2B Pitch & Lead Enrichment API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LeadRequest(BaseModel):
    company_name: str
    company_url: str = ""
    context: str = ""

class PitchResponse(BaseModel):
    pitch: str

@app.post("/api/generate-pitch", response_model=PitchResponse)
def generate_pitch(lead: LeadRequest):
    # Initialize the crew and execute
    crew = PitchCrew(
        company_name=lead.company_name,
        company_url=lead.company_url,
        context=lead.context
    )
    result = crew.run()
    return PitchResponse(pitch=str(result))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
