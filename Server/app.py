from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict
from datetime import datetime
import json
import uuid
import os

app = FastAPI()

# CORS - Add your frontend URL here
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Persistent Storage File
DB_FILE = "documents.json"

# Load Documents from Disk if Exists
def load_db():
    global documents
    if os.path.exists(DB_FILE):
        with open(DB_FILE, "r") as f:
            try:
                documents = json.load(f)
            except:
                documents = {}
    else:
        documents = {}

# Save Documents to Disk
def save_db():
    with open(DB_FILE, "w") as f:
        json.dump(documents, f, indent=2)

# Load Data on Startup
load_db()

# Active WebSocket Connections (in-memory, per doc)
# Each connection entry:
# {
#   "websocket": WebSocket,
#   "user_id": str,
#   "user_name": str,
#   "color": str,
#   "status": "Viewing" | "Typing",
#   "caret": {"pageIndex": int, "offset": int} | None
# }
active_connections: Dict[str, List[Dict]] = {}

# Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[Dict]] = {}
    
    async def connect(self, websocket: WebSocket, doc_id: str, user_info: dict):
        await websocket.accept()
        if doc_id not in self.active_connections:
            self.active_connections[doc_id] = []
        
        self.active_connections[doc_id].append({
            "websocket": websocket,
            "user_id": user_info["user_id"],
            "user_name": user_info["user_name"],
            "color": user_info.get("color", "#FF6B6B"),
            "status": "Viewing",
            "caret": None,  # <-- presence starts empty
        })
        await self.broadcast_user_list(doc_id)
    
    def disconnect(self, websocket: WebSocket, doc_id: str):
        if doc_id in self.active_connections:
            self.active_connections[doc_id] = [
                conn for conn in self.active_connections[doc_id] 
                if conn["websocket"] != websocket
            ]
            if not self.active_connections[doc_id]:
                del self.active_connections[doc_id]
    
    async def broadcast_user_list(self, doc_id: str):
        if doc_id not in self.active_connections:
            return
        
        users = [
            {
                "user_id": conn["user_id"],
                "user_name": conn["user_name"],
                "color": conn["color"],
                "status": conn["status"],
                # You can include caret in user_list if you prefer:
                # "caret": conn.get("caret"),
            }
            for conn in self.active_connections[doc_id]
        ]
        
        await self.broadcast(doc_id, {"type": "user_list", "users": users})
    
    async def broadcast(self, doc_id: str, message: dict, exclude: WebSocket = None):
        if doc_id not in self.active_connections:
            return
        
        disconnected = []
        for connection in self.active_connections[doc_id]:
            ws = connection["websocket"]
            if ws != exclude:
                try:
                    await ws.send_json(message)
                except Exception:
                    disconnected.append(ws)
        
        for ws in disconnected:
            self.disconnect(ws, doc_id)

    async def update_presence(self, doc_id: str, websocket: WebSocket, caret: dict | None):
        """Update the caret for a user and broadcast to all."""
        for conn in self.active_connections.get(doc_id, []):
            if conn["websocket"] == websocket:
                conn["caret"] = caret
                break
        # Broadcast presence as a lightweight message
        if caret is not None:
            await self.broadcast(doc_id, {
                "type": "presence",
                "user_id": conn["user_id"],
                "user_name": conn["user_name"],
                "color": conn["color"],
                "caret": caret
            })
        else:
            # If caret is None, still notify (optional)
            await self.broadcast(doc_id, {
                "type": "presence",
                "user_id": conn["user_id"],
                "user_name": conn["user_name"],
                "color": conn["color"],
                "caret": None
            })


manager = ConnectionManager()


# REST API Endpoints
@app.get("/")
async def root():
    return {"message": "Collaborative Document Editor API", "status": "running"}

@app.post("/api/documents")
async def create_document():
    doc_id = str(uuid.uuid4())
    document = {
        "id": doc_id,
        "title": "Untitled Document",
        "pages": [""],
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
        "versions": []
    }
    documents[doc_id] = document
    save_db()  # ✅ persist
    return document

@app.get("/api/documents/{doc_id}")
async def get_document(doc_id: str):
    if doc_id not in documents:
        return {"error": "Document not found"}, 404
    return documents[doc_id]

@app.put("/api/documents/{doc_id}")
async def update_document(doc_id: str, data: dict):
    if doc_id not in documents:
        return {"error": "Document not found"}, 404
    
    doc = documents[doc_id]
    
    if "title" in data:
        doc["title"] = data["title"]
    if "pages" in data:
        doc["pages"] = data["pages"]
    
    doc["updated_at"] = datetime.now().isoformat()
    save_db()  # ✅ persist
    
    return doc


# WebSocket Endpoint
@app.websocket("/ws/{doc_id}")
async def websocket_endpoint(websocket: WebSocket, doc_id: str):
    user_id = websocket.query_params.get("user_id", str(uuid.uuid4()))
    user_name = websocket.query_params.get("user_name", "Anonymous")
    color = websocket.query_params.get("color", f"#{uuid.uuid4().hex[:6]}")

    user_info = {
        "user_id": user_id,
        "user_name": user_name,
        "color": color
    }
    
    await manager.connect(websocket, doc_id, user_info)

    # Send Current Document State
    if doc_id not in documents:
        documents[doc_id] = {
            "id": doc_id,
            "title": "Untitled Document",
            "pages": [""],
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "versions": []
        }
        save_db()

    await websocket.send_json({
        "type": "document_state",
        "document": documents[doc_id]
    })

    try:
        while True:
            data = await websocket.receive_json()
            message_type = data.get("type")

            # Live page updates
            if message_type == "content_update":
                documents[doc_id]["pages"] = data["pages"]
                documents[doc_id]["updated_at"] = datetime.now().isoformat()
                save_db()  # ✅ persist

                await manager.broadcast(
                    doc_id,
                    {
                        "type": "content_update",
                        "pages": data["pages"],
                        "user_id": user_id,
                        "user_name": user_name
                    },
                    exclude=websocket
                )

            # Typing status (Viewing/Typing)
            elif message_type == "typing_status":
                for conn in manager.active_connections.get(doc_id, []):
                    if conn["websocket"] == websocket:
                        conn["status"] = "Typing" if data.get("is_typing") else "Viewing"
                        break
                await manager.broadcast_user_list(doc_id)

            # Presence / caret position
            elif message_type == "presence":
                caret = data.get("caret")  # expected: {"pageIndex": int, "offset": int}
                await manager.update_presence(doc_id, websocket, caret)

            # Version Save
            elif message_type == "save_version":
                doc = documents[doc_id]
                version = {
                    "id": f"v{len(doc['versions']) + 1}",
                    "editor": user_name,
                    "timestamp": datetime.now().isoformat(),
                    "summary": data.get("summary", "Manual Save"),
                    "pages": doc["pages"].copy()
                }
                doc["versions"].append(version)
                save_db()  # ✅ persist

                await manager.broadcast(doc_id, {
                    "type": "version_created",
                    "version": version
                })

    except WebSocketDisconnect:
        manager.disconnect(websocket, doc_id)
        await manager.broadcast_user_list(doc_id)
