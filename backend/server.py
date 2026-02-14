from fastapi import FastAPI, APIRouter, HTTPException, Request, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import requests

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== Models ====================

class AuthSessionRequest(BaseModel):
    session_id: str

class AiAskRequest(BaseModel):
    question: str
    context: Optional[str] = None

class AiSummaryRequest(BaseModel):
    journal_data: list = []
    tracked_items: list = []

class AiWebSearchRequest(BaseModel):
    query: str
    search_type: str = "peptide"  # "peptide" or "medication"

class TrackerItemCreate(BaseModel):
    type: str
    name: str
    dosage_amount: float
    dosage_unit: str
    route: str
    frequency: str
    times_of_day: List[str] = []
    notes: Optional[str] = None

class DoseLogCreate(BaseModel):
    item_id: str
    status: str
    scheduled_time: str
    notes: Optional[str] = None

class JournalEntryCreate(BaseModel):
    date: str
    weight: Optional[float] = None
    weight_unit: str = "lbs"
    energy_level: Optional[int] = None
    sleep_quality: Optional[int] = None
    sleep_hours: Optional[float] = None
    mood: Optional[str] = None
    mood_note: Optional[str] = None
    pain_level: Optional[int] = None
    notes: Optional[str] = None

class CalculatorPresetCreate(BaseModel):
    name: str
    syringe_ml: float
    syringe_units: int
    vial_mg: float
    bac_water_ml: float
    dose_mcg: float

class RecurringItemCreate(BaseModel):
    name: str
    type: str = "Peptide"  # Peptide, Supplement, Medication
    dosage_amount: float
    dosage_unit: str
    route: str
    recurrence_type: str  # daily, weekly, biweekly, monthly, custom
    recurrence_days: List[int] = []  # 0=Sun, 1=Mon, etc. for weekly/custom
    recurrence_interval: int = 1  # Every X days/weeks/months
    times_of_day: List[str] = []
    start_date: str  # ISO date string
    end_date: Optional[str] = None
    notes: Optional[str] = None
    category: Optional[str] = None  # For color coding
    reminder_enabled: bool = False

class RecurringItemUpdate(BaseModel):
    name: Optional[str] = None
    dosage_amount: Optional[float] = None
    dosage_unit: Optional[str] = None
    route: Optional[str] = None
    recurrence_type: Optional[str] = None
    recurrence_days: Optional[List[int]] = None
    recurrence_interval: Optional[int] = None
    times_of_day: Optional[List[str]] = None
    end_date: Optional[str] = None
    notes: Optional[str] = None
    category: Optional[str] = None
    reminder_enabled: Optional[bool] = None

class DoseLogCreateV2(BaseModel):
    recurring_item_id: str
    scheduled_date: str  # ISO date YYYY-MM-DD
    scheduled_time: str  # Morning, Afternoon, etc.
    status: str  # taken, skipped, delayed
    reason: Optional[str] = None  # For skipped/delayed
    actual_time: Optional[str] = None  # For delayed doses

# ==================== Auth Endpoints ====================
# REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH

@api_router.post("/auth/session")
async def auth_session(req: AuthSessionRequest, response: Response):
    try:
        auth_resp = requests.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": req.session_id}
        )
        if auth_resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session")
        data = auth_resp.json()
        existing = await db.users.find_one({"email": data["email"]}, {"_id": 0})
        if existing:
            user_id = existing["user_id"]
            await db.users.update_one({"user_id": user_id}, {"$set": {"name": data["name"], "picture": data.get("picture", "")}})
        else:
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            await db.users.insert_one({
                "user_id": user_id, "email": data["email"], "name": data["name"],
                "picture": data.get("picture", ""), "created_at": datetime.now(timezone.utc)
            })
        session_token = data.get("session_token", f"session_{uuid.uuid4().hex}")
        await db.user_sessions.insert_one({
            "user_id": user_id, "session_token": session_token,
            "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
            "created_at": datetime.now(timezone.utc)
        })
        response.set_cookie(key="session_token", value=session_token, httponly=True, secure=True, samesite="none", path="/", max_age=604800)
        return {"user_id": user_id, "email": data["email"], "name": data["name"], "picture": data.get("picture", "")}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Auth error: {e}")
        raise HTTPException(status_code=500, detail="Authentication failed")

@api_router.get("/auth/me")
async def auth_me(request: Request):
    token = request.cookies.get("session_token")
    auth_h = request.headers.get("Authorization", "")
    if auth_h.startswith("Bearer "):
        token = auth_h[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    exp = session["expires_at"]
    if isinstance(exp, str):
        exp = datetime.fromisoformat(exp)
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if exp < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"user_id": user["user_id"], "email": user["email"], "name": user["name"], "picture": user.get("picture", "")}

@api_router.post("/auth/logout")
async def auth_logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie("session_token", path="/")
    return {"message": "Logged out"}

# ==================== AI Endpoints ====================

@api_router.post("/ai/ask")
async def ai_ask(req: AiAskRequest):
    llm_key = os.environ.get('EMERGENT_LLM_KEY')
    if not llm_key:
        raise HTTPException(status_code=503, detail="AI not configured")
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        chat = LlmChat(
            api_key=llm_key,
            session_id=f"ask-{uuid.uuid4().hex[:8]}",
            system_message="You are PepTrack Pro's AI assistant specializing in peptide research, supplement science, and medication information. Provide accurate, evidence-based information. Always remind users to consult healthcare providers. Keep responses concise with bullet points."
        )
        chat.with_model("openai", "gpt-5.2")
        prompt = req.question
        if req.context:
            prompt = f"Context: {req.context}\n\nQuestion: {req.question}"
        resp = await chat.send_message(UserMessage(text=prompt))
        return {"answer": resp}
    except Exception as e:
        logger.error(f"AI ask error: {e}")
        raise HTTPException(status_code=500, detail="AI service error")

@api_router.post("/ai/summary")
async def ai_summary(req: AiSummaryRequest):
    llm_key = os.environ.get('EMERGENT_LLM_KEY')
    if not llm_key:
        raise HTTPException(status_code=503, detail="AI not configured")
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        chat = LlmChat(
            api_key=llm_key,
            session_id=f"sum-{uuid.uuid4().hex[:8]}",
            system_message="You are PepTrack Pro's health analytics AI. Generate concise weekly health summaries from journal data. Highlight trends, correlations, and practical suggestions. Be encouraging but evidence-based."
        )
        chat.with_model("openai", "gpt-5.2")
        data_str = f"Journal entries: {req.journal_data[:10]}\nTracked items: {req.tracked_items[:10]}"
        resp = await chat.send_message(UserMessage(text=f"Generate a concise weekly health summary:\n{data_str}"))
        return {"summary": resp}
    except Exception as e:
        logger.error(f"AI summary error: {e}")
        raise HTTPException(status_code=500, detail="AI service error")

@api_router.post("/ai/web-search")
async def ai_web_search(req: AiWebSearchRequest):
    """AI-powered web search for peptide/medication research with summarized results."""
    llm_key = os.environ.get('EMERGENT_LLM_KEY')
    if not llm_key:
        raise HTTPException(status_code=503, detail="AI not configured")
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        # Create a research-focused prompt
        if req.search_type == "peptide":
            system_msg = """You are PepTrack Pro's peptide research AI assistant. Your role is to provide comprehensive, evidence-based information about peptides.

When researching a peptide, provide:
1. **Overview**: What it is and its primary purpose
2. **Mechanism of Action**: How it works in the body
3. **Common Uses**: What it's typically used for
4. **Dosage Guidelines**: Typical dosing ranges (always note this is educational only)
5. **Administration**: How it's typically administered
6. **Side Effects**: Common and potential side effects
7. **Research Status**: Current state of clinical research
8. **Important Warnings**: Any critical safety information

IMPORTANT: Always remind users this is educational information only and they should consult a healthcare provider before using any peptide. Format your response with clear headers and bullet points for easy reading."""
        else:
            system_msg = """You are PepTrack Pro's medication research AI assistant. Your role is to provide comprehensive, evidence-based information about medications.

When researching a medication, provide:
1. **Overview**: What it is and its drug class
2. **Uses**: FDA-approved and common off-label uses
3. **How It Works**: Mechanism of action
4. **Dosage**: Typical dosing guidelines
5. **Side Effects**: Common and serious side effects
6. **Interactions**: Major drug interactions to be aware of
7. **Warnings**: Important precautions and contraindications

IMPORTANT: Always remind users this is educational information only and they should consult a healthcare provider or pharmacist for medical advice. Format your response with clear headers and bullet points for easy reading."""

        chat = LlmChat(
            api_key=llm_key,
            session_id=f"websearch-{uuid.uuid4().hex[:8]}",
            system_message=system_msg
        )
        chat.with_model("openai", "gpt-5.2")
        
        prompt = f"Please provide comprehensive research information about: {req.query}"
        
        resp = await chat.send_message(UserMessage(text=prompt))
        
        return {
            "query": req.query,
            "search_type": req.search_type,
            "result": resp,
            "disclaimer": "This information is for educational purposes only. Always consult a qualified healthcare provider before using any peptides or medications."
        }
    except Exception as e:
        logger.error(f"AI web search error: {e}")
        raise HTTPException(status_code=500, detail="AI service error")

# ==================== Tracker CRUD ====================

@api_router.post("/tracker/items")
async def create_tracker_item(item: TrackerItemCreate):
    doc = item.dict()
    doc["item_id"] = f"item_{uuid.uuid4().hex[:12]}"
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.tracker_items.insert_one(doc)
    return await db.tracker_items.find_one({"item_id": doc["item_id"]}, {"_id": 0})

@api_router.get("/tracker/items")
async def get_tracker_items():
    return await db.tracker_items.find({}, {"_id": 0}).to_list(1000)

@api_router.delete("/tracker/items/{item_id}")
async def delete_tracker_item(item_id: str):
    result = await db.tracker_items.delete_one({"item_id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Deleted"}

@api_router.post("/tracker/doses")
async def log_dose(dose: DoseLogCreate):
    doc = dose.dict()
    doc["log_id"] = f"log_{uuid.uuid4().hex[:12]}"
    doc["logged_time"] = datetime.now(timezone.utc).isoformat()
    await db.dose_logs.insert_one(doc)
    return await db.dose_logs.find_one({"log_id": doc["log_id"]}, {"_id": 0})

@api_router.get("/tracker/doses")
async def get_doses(date: Optional[str] = None):
    query = {}
    if date:
        query["scheduled_time"] = {"$regex": f"^{date}"}
    return await db.dose_logs.find(query, {"_id": 0}).to_list(1000)

# ==================== Journal CRUD ====================

@api_router.post("/journal/entries")
async def create_journal_entry(entry: JournalEntryCreate):
    doc = entry.dict()
    doc["entry_id"] = f"entry_{uuid.uuid4().hex[:12]}"
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.journal_entries.insert_one(doc)
    return await db.journal_entries.find_one({"entry_id": doc["entry_id"]}, {"_id": 0})

@api_router.get("/journal/entries")
async def get_journal_entries(limit: int = 30):
    return await db.journal_entries.find({}, {"_id": 0}).sort("date", -1).to_list(limit)

# ==================== Calculator Presets ====================

@api_router.post("/calculator/presets")
async def create_preset(preset: CalculatorPresetCreate):
    doc = preset.dict()
    doc["preset_id"] = f"preset_{uuid.uuid4().hex[:12]}"
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.calculator_presets.insert_one(doc)
    return await db.calculator_presets.find_one({"preset_id": doc["preset_id"]}, {"_id": 0})

@api_router.get("/calculator/presets")
async def get_presets():
    return await db.calculator_presets.find({}, {"_id": 0}).to_list(100)

@api_router.delete("/calculator/presets/{preset_id}")
async def delete_preset(preset_id: str):
    result = await db.calculator_presets.delete_one({"preset_id": preset_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Preset not found")
    return {"message": "Deleted"}

# ==================== Recurring Items CRUD ====================

@api_router.post("/recurring-items")
async def create_recurring_item(item: RecurringItemCreate):
    doc = item.dict()
    doc["item_id"] = f"rec_{uuid.uuid4().hex[:12]}"
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["is_active"] = True
    await db.recurring_items.insert_one(doc)
    return await db.recurring_items.find_one({"item_id": doc["item_id"]}, {"_id": 0})

@api_router.get("/recurring-items")
async def get_recurring_items(active_only: bool = True):
    query = {"is_active": True} if active_only else {}
    return await db.recurring_items.find(query, {"_id": 0}).to_list(500)

@api_router.get("/recurring-items/{item_id}")
async def get_recurring_item(item_id: str):
    item = await db.recurring_items.find_one({"item_id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Recurring item not found")
    return item

@api_router.put("/recurring-items/{item_id}")
async def update_recurring_item(item_id: str, update: RecurringItemUpdate):
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.recurring_items.update_one(
        {"item_id": item_id},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Recurring item not found")
    return await db.recurring_items.find_one({"item_id": item_id}, {"_id": 0})

@api_router.delete("/recurring-items/{item_id}")
async def delete_recurring_item(item_id: str):
    # Soft delete - mark as inactive
    result = await db.recurring_items.update_one(
        {"item_id": item_id},
        {"$set": {"is_active": False, "deleted_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Recurring item not found")
    return {"message": "Deleted"}

# Helper to get scheduled items for a specific date
def get_scheduled_for_date(item: dict, target_date: str) -> bool:
    """Check if a recurring item is scheduled for a specific date."""
    from datetime import datetime as dt
    target = dt.fromisoformat(target_date)
    start = dt.fromisoformat(item["start_date"])
    
    if target < start:
        return False
    
    if item.get("end_date"):
        end = dt.fromisoformat(item["end_date"])
        if target > end:
            return False
    
    rec_type = item["recurrence_type"]
    interval = item.get("recurrence_interval", 1)
    days_diff = (target - start).days
    
    if rec_type == "daily":
        return days_diff % interval == 0
    elif rec_type == "weekly":
        rec_days = item.get("recurrence_days", [])
        target_day = target.weekday()  # 0=Mon, 6=Sun
        # Convert our format (0=Sun) to Python's (0=Mon)
        converted_day = (target_day + 1) % 7
        if converted_day not in rec_days:
            return False
        weeks_diff = days_diff // 7
        return weeks_diff % interval == 0
    elif rec_type == "biweekly":
        weeks_diff = days_diff // 7
        target_day = target.weekday()
        converted_day = (target_day + 1) % 7
        rec_days = item.get("recurrence_days", [])
        return weeks_diff % 2 == 0 and converted_day in rec_days
    elif rec_type == "monthly":
        months_diff = (target.year - start.year) * 12 + (target.month - start.month)
        return months_diff % interval == 0 and target.day == start.day
    elif rec_type == "custom":
        return days_diff % interval == 0
    
    return False

@api_router.get("/recurring-items/schedule/{date}")
async def get_schedule_for_date(date: str):
    """Get all recurring items scheduled for a specific date."""
    items = await db.recurring_items.find({"is_active": True}, {"_id": 0}).to_list(500)
    scheduled = []
    for item in items:
        if get_scheduled_for_date(item, date):
            scheduled.append(item)
    return scheduled

@api_router.post("/recurring-items/dose-log")
async def log_recurring_dose(log: DoseLogCreateV2):
    doc = log.dict()
    doc["log_id"] = f"rlog_{uuid.uuid4().hex[:12]}"
    doc["logged_at"] = datetime.now(timezone.utc).isoformat()
    # Upsert: replace existing log for same item/date/time
    await db.recurring_dose_logs.update_one(
        {
            "recurring_item_id": doc["recurring_item_id"],
            "scheduled_date": doc["scheduled_date"],
            "scheduled_time": doc["scheduled_time"]
        },
        {"$set": doc},
        upsert=True
    )
    return await db.recurring_dose_logs.find_one(
        {"log_id": doc["log_id"]}, {"_id": 0}
    ) or doc

@api_router.get("/recurring-items/dose-logs/{date}")
async def get_recurring_dose_logs(date: str):
    """Get all dose logs for recurring items on a specific date."""
    return await db.recurring_dose_logs.find(
        {"scheduled_date": date}, {"_id": 0}
    ).to_list(500)

# ==================== Custom Entries ====================

class CustomPeptideCreate(BaseModel):
    name: str
    aliases: List[str] = []
    categories: List[str] = []
    description: str = ""
    mechanism: str = ""
    dosage_low: str = ""
    dosage_moderate: str = ""
    dosage_higher: str = ""
    frequency: str = ""
    cycle_length: str = ""
    routes: List[str] = []
    side_effects: List[str] = []
    contraindications: List[str] = []
    storage: str = ""
    default_vial_mg: float = 5
    default_dose_mcg: float = 250
    default_bac_water_ml: float = 2

class CustomMedicationCreate(BaseModel):
    generic_name: str
    brand_names: List[str] = []
    drug_class: str = ""
    uses: List[str] = []
    standard_dosage: str = ""
    side_effects: List[str] = []
    contraindications: List[str] = []
    interactions: List[str] = []
    timing: str = ""

@api_router.post("/custom/peptides")
async def create_custom_peptide(peptide: CustomPeptideCreate):
    doc = peptide.dict()
    doc["peptide_id"] = f"custom_{uuid.uuid4().hex[:12]}"
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["is_custom"] = True
    await db.custom_peptides.insert_one(doc)
    return await db.custom_peptides.find_one({"peptide_id": doc["peptide_id"]}, {"_id": 0})

@api_router.get("/custom/peptides")
async def get_custom_peptides():
    return await db.custom_peptides.find({}, {"_id": 0}).to_list(500)

@api_router.delete("/custom/peptides/{peptide_id}")
async def delete_custom_peptide(peptide_id: str):
    result = await db.custom_peptides.delete_one({"peptide_id": peptide_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Custom peptide not found")
    return {"message": "Deleted"}

@api_router.post("/custom/medications")
async def create_custom_medication(med: CustomMedicationCreate):
    doc = med.dict()
    doc["medication_id"] = f"custom_{uuid.uuid4().hex[:12]}"
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["is_custom"] = True
    await db.custom_medications.insert_one(doc)
    return await db.custom_medications.find_one({"medication_id": doc["medication_id"]}, {"_id": 0})

@api_router.get("/custom/medications")
async def get_custom_medications():
    return await db.custom_medications.find({}, {"_id": 0}).to_list(500)

@api_router.delete("/custom/medications/{medication_id}")
async def delete_custom_medication(medication_id: str):
    result = await db.custom_medications.delete_one({"medication_id": medication_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Custom medication not found")
    return {"message": "Deleted"}

# ==================== Health Check ====================

@api_router.get("/")
async def root():
    return {"message": "PepTrack Pro API", "status": "healthy", "version": "1.0.0"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
