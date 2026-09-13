# ClearBin — AI Smart Waste Management System

A real, working full-stack IoT + AI platform for monitoring waste bins,
predicting when they'll fill up, and optimizing collection routes.

```
ESP32 + Sensors → Wi-Fi → Flask REST API → Supabase PostgreSQL → AI/ML → React Dashboard
```

This is not a UI mockup — every screen reads live data from a real database
through a real API. Before your physical hardware is ready, you can push
test sensor readings through the same API the ESP32 will eventually use.

---

## Project Structure

```
smart-waste-management/
├── backend/                 Flask REST API + ML modules
│   ├── app.py                Entry point
│   ├── config/                Configuration (thresholds, Supabase keys)
│   ├── routes/                One file per API resource (bins, alerts, etc.)
│   ├── services/               Shared business logic (bin_service, supabase_client)
│   ├── ml/                     predictor.py (fill prediction) + route_optimizer.py
│   └── scripts/                send_test_data.py - simulate sensors
│
├── frontend/                React dashboard (Vite)
│   └── src/
│       ├── pages/             One file per dashboard page
│       ├── components/        Sidebar, StatCard, FillBar, StatusPill, TopBar
│       ├── api/client.js      Every backend call goes through here
│       └── hooks/usePolling.js  Near-real-time auto-refresh (no WebSockets needed)
│
├── hardware/
│   └── esp32_smart_bin/esp32_smart_bin.ino   ESP32 + HC-SR04 firmware
│
├── database/
│   └── schema.sql            Run this in the Supabase SQL editor
│
└── README.md                 (this file)
```

---

## Step-by-step setup (follow in this order)

### 1. Create your Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free project.
2. Open **SQL Editor** → paste the entire contents of `database/schema.sql` → **Run**.
3. Go to **Project Settings → API** and copy your **Project URL** and
   **anon/service_role key** — you'll need both in step 2.

### 2. Run the backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env            # then edit .env with your Supabase URL + key

python app.py
```

Visit `http://localhost:5000/` — you should see `{"status": "ok", ...}`.
That confirms the backend is running and Supabase is connected.

### 3. Push some test sensor data (no hardware needed yet)

In a **second terminal**, with the backend still running:

```bash
cd backend
source venv/bin/activate
python scripts/send_test_data.py --simulate 15
```

This simulates 5 bins each gradually filling up over 15 readings — enough
history for the ML predictor to start estimating "time to full", and
enough spread in fill levels for the route optimizer to have full/critical
bins to plan around.

### 4. Run the frontend

```bash
cd frontend
npm install
cp .env.example .env            # default already points to localhost:5000, edit if needed
npm run dev
```

Open `http://localhost:5173`. You should see live bins, charts, predictions,
and a map — all driven by the test data you just sent.

### 5. Explore the dashboard

- **Dashboard** — overview cards + status distribution + recent alerts
- **Live Bins** — filterable grid of every bin's current reading
- **Bin Details** (click any bin) — history chart + AI prediction
- **Map** — geographic view with a "Show Collection Route" toggle
- **AI Predictions** — plain-English fill forecasts for every bin
- **Route Optimization** — generates a nearest-neighbor collection order
- **Collections** — mark a bin collected, view collection history
- **Illegal Dumping** — report and track dumping incidents
- **Alerts** — auto-raised when a bin goes full/critical
- **Settings** — connection info and threshold reference

### 6. Connect the real ESP32 (when your hardware arrives)

1. Wire an HC-SR04 ultrasonic sensor to the ESP32 (pinout is documented at
   the top of `hardware/esp32_smart_bin/esp32_smart_bin.ino`).
2. Open the `.ino` file in the Arduino IDE, install the **ArduinoJson**
   library, and fill in your Wi-Fi credentials and your backend's IP address
   (e.g. `http://192.168.1.50:5000/api/sensor-data` — your computer's local
   IP, not `localhost`, since the ESP32 is a separate device on the network).
3. Measure the distance from the sensor to the bottom of an empty bin and
   set `BIN_EMPTY_DISTANCE_CM` accordingly.
4. Upload the sketch. Open the Serial Monitor to watch it read distance,
   convert it to a fill percentage, and POST it to your backend.
5. Stop running `send_test_data.py` and watch the dashboard update from the
   real sensor instead.

No frontend changes are needed for this step — the ESP32, your test
script, and any future sensor all talk to the exact same `/api/sensor-data`
endpoint.

---

## How the AI prediction works (for your viva)

The model is deliberately simple so it's easy to explain and defend:

1. Pull a bin's last ~20 sensor readings (fill % + timestamp).
2. Fit a straight line through them using **scikit-learn's LinearRegression**,
   with "hours since first reading" as X and "fill %" as Y.
3. The line's slope is the bin's fill rate (% per hour).
4. Extend the line forward to see when it crosses 100% — that's the
   predicted time to full.

This is the same logic as extending a trend line on a graph with a ruler.
It requires no training data collection, no labels, and no black-box
tuning — perfect as a first working model, with an obvious "future work"
extension (e.g. factoring in day-of-week patterns) for your report.

## How route optimization works

A **nearest-neighbor** greedy algorithm: starting from the waste facility,
repeatedly visit the closest bin that still needs collection, with a small
distance "discount" applied to critical bins so they're prioritized over a
merely-closer full bin. This is the standard first approach to the
Traveling Salesman Problem — fast, explainable, and good enough for a real
collection run. A natural next step is swapping in 2-opt or Google
OR-Tools once the basic version works end-to-end.

---

## Troubleshooting

- **Dashboard shows nothing** → confirm the backend is running and that
  `frontend/.env`'s `VITE_API_BASE_URL` matches where Flask is listening.
- **"SUPABASE_URL / SUPABASE_KEY are not set"** → you skipped step 1 or
  forgot to fill in `backend/.env`.
- **Predictions say "insufficient_data"** → a bin needs at least 3 readings
  before a trend line can be fit. Run `send_test_data.py --simulate` again.
- **Map is blank** → bins need `latitude`/`longitude`; the test script sets
  these automatically, but data sent manually via curl/Postman needs them too.
