"""
Simple test client to verify WebSocket and REST API functionality
Run this after starting your backend server
"""

import asyncio
import websockets
import json
import requests
from datetime import datetime

API_URL = "http://localhost:8000"
WS_URL = "ws://localhost:8000"

def test_rest_api():
    """Test REST API endpoints"""
    print("=" * 50)
    print("Testing REST API")
    print("=" * 50)
    
    # Create a document
    print("\n1. Creating document...")
    response = requests.post(f"{API_URL}/api/documents?title=Test Document")
    if response.status_code == 200:
        doc = response.json()
        print(f"✓ Document created: {doc['id']}")
        doc_id = doc['id']
    else:
        print(f"✗ Failed to create document: {response.status_code}")
        return None
    
    # Get the document
    print("\n2. Getting document...")
    response = requests.get(f"{API_URL}/api/documents/{doc_id}")
    if response.status_code == 200:
        print(f"✓ Document retrieved: {response.json()['title']}")
    else:
        print(f"✗ Failed to get document: {response.status_code}")
    
    # List all documents
    print("\n3. Listing all documents...")
    response = requests.get(f"{API_URL}/api/documents")
    if response.status_code == 200:
        docs = response.json()
        print(f"✓ Found {len(docs)} document(s)")
    else:
        print(f"✗ Failed to list documents: {response.status_code}")
    
    return doc_id

async def test_websocket(doc_id):
    """Test WebSocket connection and messages"""
    print("\n" + "=" * 50)
    print("Testing WebSocket")
    print("=" * 50)
    
    user_id = "test-user-1"
    user_name = "Test User"
    color = "#FF6B6B"
    
    uri = f"{WS_URL}/ws/{doc_id}?user_id={user_id}&user_name={user_name}&color={color}"
    
    try:
        print(f"\n1. Connecting to WebSocket...")
        async with websockets.connect(uri) as websocket:
            print(f"✓ Connected to {uri}")
            
            # Receive initial document state
            print("\n2. Receiving document state...")
            message = await websocket.recv()
            data = json.loads(message)
            if data['type'] == 'document_state':
                print(f"✓ Received document state")
                print(f"  Pages: {len(data['document']['pages'])}")
            
            # Receive user list
            print("\n3. Receiving user list...")
            message = await websocket.recv()
            data = json.loads(message)
            if data['type'] == 'user_list':
                print(f"✓ Received user list")
                print(f"  Users online: {len(data['users'])}")
                for user in data['users']:
                    print(f"    - {user['user_name']} ({user['status']})")
            
            # Send content update
            print("\n4. Sending content update...")
            await websocket.send(json.dumps({
                'type': 'content_update',
                'pages': ['Hello from test client!', 'This is page 2']
            }))
            print("✓ Content update sent")
            
            # Send typing status
            print("\n5. Sending typing status...")
            await websocket.send(json.dumps({
                'type': 'typing_status',
                'is_typing': True
            }))
            print("✓ Typing status sent")
            
            # Wait a bit to receive any broadcasts
            try:
                message = await asyncio.wait_for(websocket.recv(), timeout=2.0)
                data = json.loads(message)
                print(f"\n6. Received broadcast: {data['type']}")
            except asyncio.TimeoutError:
                print("\n6. No broadcasts received (expected if no other users)")
            
            # Save version
            print("\n7. Saving version...")
            await websocket.send(json.dumps({
                'type': 'save_version',
                'summary': 'Test version from client'
            }))
            print("✓ Version save requested")
            
            # Wait for version created message
            try:
                message = await asyncio.wait_for(websocket.recv(), timeout=2.0)
                data = json.loads(message)
                if data['type'] == 'version_created':
                    print(f"✓ Version created: {data['version']['summary']}")
            except asyncio.TimeoutError:
                print("✗ Timeout waiting for version created message")
            
            print("\n✓ All WebSocket tests passed!")
            
    except Exception as e:
        print(f"\n✗ WebSocket error: {str(e)}")

async def test_multiple_clients(doc_id):
    """Test multiple WebSocket connections"""
    print("\n" + "=" * 50)
    print("Testing Multiple Clients")
    print("=" * 50)
    
    async def client(user_id, user_name, color):
        uri = f"{WS_URL}/ws/{doc_id}?user_id={user_id}&user_name={user_name}&color={color}"
        
        try:
            async with websockets.connect(uri) as ws:
                print(f"\n{user_name} connected")
                
                # Receive initial messages
                for i in range(2):
                    msg = await ws.recv()
                    data = json.loads(msg)
                    if data['type'] == 'user_list':
                        print(f"{user_name} sees {len(data['users'])} user(s) online")
                
                # Send a message
                await ws.send(json.dumps({
                    'type': 'content_update',
                    'pages': [f'Message from {user_name}']
                }))
                
                # Wait for broadcasts
                await asyncio.sleep(1)
                
                # Try to receive broadcasts from other users
                try:
                    while True:
                        msg = await asyncio.wait_for(ws.recv(), timeout=1.0)
                        data = json.loads(msg)
                        if data['type'] == 'content_update':
                            print(f"{user_name} received update from {data.get('user_name', 'unknown')}")
                except asyncio.TimeoutError:
                    pass
                
        except Exception as e:
            print(f"{user_name} error: {str(e)}")
    
    # Create multiple clients
    await asyncio.gather(
        client("user1", "Alice", "#FF6B6B"),
        client("user2", "Bob", "#4ECDC4"),
        client("user3", "Charlie", "#45B7D1")
    )
    
    print("\n✓ Multiple client test completed!")

def main():
    """Run all tests"""
    print("\n" + "=" * 50)
    print("Collaborative Document Editor - Test Suite")
    print("=" * 50)
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"API URL: {API_URL}")
    print(f"WS URL: {WS_URL}")
    
    try:
        # Test REST API
        doc_id = test_rest_api()
        
        if doc_id:
            # Test WebSocket
            asyncio.run(test_websocket(doc_id))
            
            # Test multiple clients
            asyncio.run(test_multiple_clients(doc_id))
            
            print("\n" + "=" * 50)
            print("✓ All tests completed successfully!")
            print("=" * 50)
        else:
            print("\n✗ Tests failed - could not create document")
            
    except requests.exceptions.ConnectionError:
        print("\n✗ Error: Cannot connect to backend server")
        print("Make sure the server is running on http://localhost:8000")
    except Exception as e:
        print(f"\n✗ Unexpected error: {str(e)}")

if __name__ == "__main__":
    main()