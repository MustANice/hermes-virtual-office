import urllib.request
import json
import sqlite3

conn = sqlite3.connect('/root/.9router/db/data.sqlite')
row = conn.cursor().execute('SELECT data FROM providerConnections WHERE provider="antigravity" LIMIT 1').fetchone()
conn.close()

data = json.loads(row[0])
token = data['accessToken']
project = data.get('projectId', 'aicode-consumers')

url = f"https://us-central1-aiplatform.googleapis.com/v1/projects/{project}/locations/us-central1/publishers/google/models/imagen-3.0-generate-002:predict"
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}
body = {
    "instances": [{"prompt": "A modern corporate office interior"}],
    "parameters": {"sampleCount": 1}
}

req = urllib.request.Request(url, data=json.dumps(body).encode('utf-8'), headers=headers)
try:
    with urllib.request.urlopen(req) as resp:
        print("Success! Status:", resp.status)
        res = json.loads(resp.read().decode('utf-8'))
        print("Keys:", list(res.keys()))
except urllib.error.HTTPError as e:
    print("HTTPError:", e.code, e.read().decode('utf-8'))
except Exception as e:
    print("Error:", e)
