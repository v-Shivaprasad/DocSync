# Collaborative Document Editor - Backend Setup Guide

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+ (for frontend)
- pip (Python package manager)

### Backend Setup

1. **Create a virtual environment**
```bash
python -m venv venv

# On Windows
venv\Scripts\activate

# On Mac/Linux
source venv/bin/activate
```

2. **Install dependencies**
```bash
pip install -r requirements.txt
```

3. **Run the server**
```bash
python main.py
```

The server will start at `http://localhost:8000`

### Frontend Setup

1. **Install the WebSocket hook**

Copy `useWebSocket.ts` to your frontend project (e.g., `src/hooks/useWebSocket.ts`)

2. **Update your Editor component**

Replace your current `Editor.tsx` with the updated version that includes WebSocket integration.

3. **Update environment variables**

Create a `.env.local` file in your frontend project:
```env
NEXT_PUBLIC_WS_URL=ws://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:8000
```

4. **Start your frontend**
```bash
npm run dev
# or
yarn dev
```

## 📡 API Endpoints

### REST API

- `POST /api/documents` - Create a new document
- `GET /api/documents/{doc_id}` - Get a document
- `GET /api/documents` - List all documents
- `PUT /api/documents/{doc_id}` - Update a document
- `GET /api/documents/{doc_id}/versions` - Get version history

### WebSocket

- `WS /ws/{doc_id}?user_id={id}&user_name={name}&color={color}` - Connect to document

### WebSocket Message Types

**Client → Server:**
```json
{
  "type": "content_update",
  "pages": ["page 1 content", "page 2 content"]
}

{
  "type": "typing_status",
  "is_typing": true
}

{
  "type": "cursor_position",
  "position": { "page": 0, "offset": 10 }
}

{
  "type": "save_version",
  "summary": "Manual save"
}
```

**Server → Client:**
```json
{
  "type": "document_state",
  "document": { ... }
}

{
  "type": "content_update",
  "pages": ["..."],
  "user_id": "...",
  "user_name": "..."
}

{
  "type": "user_list",
  "users": [{ "user_id": "...", "user_name": "...", "color": "...", "status": "..." }]
}

{
  "type": "version_created",
  "version": { ... }
}
```

## 🔧 Configuration

### CORS Settings

Update the `allow_origins` in `main.py` to match your frontend URL:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Production Deployment

For production, consider:

1. **Use a real database** (PostgreSQL recommended)
   - Uncomment database dependencies in `requirements.txt`
   - Use the `database.py` file for SQLAlchemy models
   - Replace in-memory storage with database calls

2. **Use Redis for WebSocket state**
   ```bash
   pip install redis aioredis
   ```

3. **Add authentication**
   ```bash
   pip install python-jose[cryptography] passlib[bcrypt]
   ```

4. **Environment variables**
   Create a `.env` file:
   ```env
   DATABASE_URL=postgresql://user:password@localhost/dbname
   REDIS_URL=redis://localhost:6379
   SECRET_KEY=your-secret-key
   ```

5. **Run with Gunicorn**
   ```bash
   pip install gunicorn
   gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
   ```

## 🏗️ Architecture

```
Frontend (React/Next.js)
    ↕ WebSocket Connection
Backend (FastAPI)
    ↕
Database (PostgreSQL) - Optional
Redis (for scaling) - Optional
```

## 🧪 Testing

### Test WebSocket connection
```bash
pip install websockets
python -c "
import asyncio
import websockets
import json

async def test():
    async with websockets.connect('ws://localhost:8000/ws/test-doc?user_id=test&user_name=TestUser') as ws:
        data = await ws.recv()
        print('Received:', data)

asyncio.run(test())
"
```

### Test REST API
```bash
curl http://localhost:8000/api/documents
```

## 📝 Usage Example

```typescript
// In your main App or Document component
import Editor from './components/Editor';

function App() {
  const docId = 'my-document-id'; // Get from URL params or create new
  const userId = 'user-123'; // Get from auth system
  const userName = 'John Doe'; // Get from auth system

  return (
    <Editor 
      docId={docId}
      userId={userId}
      userName={userName}
    />
  );
}
```

## 🐛 Troubleshooting

**WebSocket connection fails:**
- Check if backend is running on port 8000
- Verify CORS settings
- Check browser console for errors

**Content not syncing:**
- Check WebSocket connection status
- Verify `sendContentUpdate` is being called
- Check backend logs for errors

**Users not appearing:**
- Ensure unique user IDs
- Check WebSocket query parameters
- Verify `onUsersUpdate` callback

## 🔐 Security Considerations

1. **Authentication**: Add JWT or session-based auth
2. **Authorization**: Implement document permissions
3. **Rate limiting**: Prevent abuse of WebSocket connections
4. **Input validation**: Sanitize user content
5. **HTTPS/WSS**: Use secure connections in production

## 📚 Next Steps

- [ ] Add user authentication
- [ ] Implement document permissions
- [ ] Add rich text formatting
- [ ] Implement cursor tracking visualization
- [ ] Add comments and annotations
- [ ] Export to PDF/DOCX
- [ ] Add search functionality
- [ ] Implement conflict resolution

## 📄 License

MIT License - feel free to use in your projects!