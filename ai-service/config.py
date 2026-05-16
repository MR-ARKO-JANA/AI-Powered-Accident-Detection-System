import os
from dotenv import load_dotenv

# Load variables from .env file
load_dotenv()

class Config:
    CAM_ID = os.getenv("CAM_ID", "CAM-UNKNOWN")
    LOCATION = os.getenv("LOCATION", "Unknown Location")
    BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5000/api/accidents")
    UPLOAD_URL = os.getenv("UPLOAD_URL", "http://localhost:5000/api/upload")
    WEBSOCKET_URL = os.getenv("WEBSOCKET_URL", "http://localhost:5000")
    COOLDOWN_SECONDS = int(os.getenv("COOLDOWN_SECONDS", 30))
    REDIS_BROKER_URL = os.getenv("REDIS_BROKER_URL", "redis://localhost:6379/0")
    PORT = int(os.getenv("PORT", 5001))
    DEBUG_MODE = os.getenv("DEBUG_MODE", "True").lower() == "true"
    
    # Internal paths
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    DB_FILE = os.path.join(BASE_DIR, 'offline_alerts.db')
    MODEL_PATH = os.path.join(BASE_DIR, 'model', 'accident_model.h5')
    TEMP_DIR = os.path.join(BASE_DIR, 'temp_frames')

# Ensure temp directory exists
if not os.path.exists(Config.TEMP_DIR):
    os.makedirs(Config.TEMP_DIR)
