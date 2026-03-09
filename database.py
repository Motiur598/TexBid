import os
from motor.motor_asyncio import AsyncIOMotorClient

# Note: In a production app, use environment variables for connection strings.
# For demonstration purposes, we're using a local default connection running on port 27017.
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DATABASE_NAME = "texbid_db"

client = None
db = None

async def connect_to_mongo():
    global client, db
    try:
        client = AsyncIOMotorClient(MONGO_URL)
        db = client[DATABASE_NAME]
        print(f"Connected to MongoDB at {MONGO_URL}, database: {DATABASE_NAME}")
    except Exception as e:
        print(f"Could not connect to MongoDB: {e}")

async def close_mongo_connection():
    global client
    if client:
        client.close()
        print("MongoDB connection closed.")
