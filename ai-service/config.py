import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Camera / Location
    CAM_ID = os.getenv("CAM_ID", "CAM-UNKNOWN")
    LOCATION = os.getenv("LOCATION", "Unknown Location")
    CAM_LAT = float(os.getenv("CAM_LAT", 22.5726))
    CAM_LNG = float(os.getenv("CAM_LNG", 88.3639))

    # Backend URLs
    BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5000/api/accidents")
    UPLOAD_URL = os.getenv("UPLOAD_URL", "http://localhost:5000/api/upload")
    WEBSOCKET_URL = os.getenv("WEBSOCKET_URL", "http://localhost:5000")

    # Detection Configuration
    CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", 0.3))
    COOLDOWN_SECONDS = int(os.getenv("COOLDOWN_SECONDS", 30))

    # Service Configuration
    PORT = int(os.getenv("PORT", 5001))
    DEBUG_MODE = os.getenv("DEBUG_MODE", "True").lower() == "true"
    USE_CELERY = os.getenv("USE_CELERY", "False").lower() == "true"
    REDIS_BROKER_URL = os.getenv("REDIS_BROKER_URL", "redis://localhost:6379/0")

    # Security
    API_SECRET_KEY = os.getenv("API_SECRET_KEY", "apads_ai_secret_api_key_2026")

    # Internal paths
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    MODEL_PATH = os.getenv("MODEL_PATH", os.path.join(BASE_DIR, 'model', 'accident_model.h5'))
    DB_FILE = os.path.join(BASE_DIR, 'offline_alerts.db')
    TEMP_DIR = os.path.join(BASE_DIR, 'temp_frames')

# Ensure temp directory exists
if not os.path.exists(Config.TEMP_DIR):
    os.makedirs(Config.TEMP_DIR)
