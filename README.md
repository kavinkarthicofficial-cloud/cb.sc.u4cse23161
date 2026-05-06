 Project Structure

```
├── logging_middleware/              # Reusable logging middleware package
│   ├── config.js                    # Configuration & credentials
│   └── index.js                     # Log(stack, level, pkg, message)
│
├── vehicle_maintenance_scheduler/   # Vehicle Maintenance Scheduler Microservice
│   ├── services/
│   │   └── depotService.js          # API service for depots & vehicles
│   ├── knapsack.js                  # 0/1 Knapsack DP algorithm
│   └── index.js                     # Express server (port 3000)
│
├── notification_app_be/             # Notification Backend - Priority Inbox (Stage 6)
│   ├── priorityHeap.js              # Min-Heap data structure
│   └── index.js                     # Express server (port 4000)
│
├── notification_system_design.md    # Stages 1-6 system design document
├── .gitignore
└── README.md
```

 Setup

1. Install dependencies in each folder:
```bash
cd logging_middleware && npm install
cd ../vehicle_maintenance_scheduler && npm install
cd ../notification_app_be && npm install
```

2. Update `logging_middleware/config.js` with your credentials.

3. Run services:
```bash
# Vehicle Maintenance Scheduler (port 3000)
cd vehicle_maintenance_scheduler && npm start

# Notification App Backend (port 4000)
cd notification_app_be && npm start
```

API Endpoints

 Vehicle Maintenance Scheduler (Port 3000)
- `GET /schedule` — Optimal maintenance schedule for all depots
- `GET /schedule/:depotId` — Schedule for a specific depot
- `GET /health` — Health check

 Notification App Backend (Port 4000)
- `GET /notifications/priority?n=10` — Top N priority notifications
- `GET /notifications` — All notifications
- `GET /health` — Health check


Campus Hiring Evaluation — Backend Track

Project Structure

├── logging_middleware/              # Reusable logging middleware package
│   ├── config.js                    # Credentials (see Setup — do not commit)
│   └── index.js                     # Log(stack, level, pkg, message)
│
├── vehicle_scheduling/              # Vehicle Maintenance Scheduler Microservice
│   ├── services/
│   │   └── depotService.js          # Fetches depots & vehicles from evaluation API
│   ├── knapsack.js                  # 0/1 Knapsack DP algorithm (no external libs)
│   └── index.js                     # Express server (port 3000)
│
├── notification_app_be/             # Campus Notifications Backend (Stages 1–6)
│   ├── priorityHeap.js              # Min-Heap for real-time top-N maintenance
│   ├── index.js                     # Express server (port 4000)
│   └── screenshots/                 # Output screenshots (Stage 6)
│
├── notification_system_design.md    # Full system design — Stages 1 through 6
├── .env.example                     # Environment variable template
├── .gitignore
└── README.md


Setup

Prerequisites
- Node.js >= 18.0.0
- npm

1. Configure credentials

Copy the environment template and fill in your registered credentials:

cp .env.example .env


.env is gitignored. Never commit your clientID, clientSecret, or accessCode directly into any source file.

2. Install dependencies

cd logging_middleware && npm install && cd ..
cd vehicle_scheduling && npm install && cd ..
cd notification_app_be && npm install && cd ..


3. Run services

 Vehicle Maintenance Scheduler — port 3000
cd vehicle_scheduling && npm start

 Notification App Backend — port 4000
cd notification_app_be && npm start


API Endpoints

Vehicle Maintenance Scheduler (Port 3000)
Method	Endpoint	Description
GET	/health	Health check
GET	/schedule	Optimal maintenance schedule for all depots
GET	/schedule/:depotId	Schedule for a specific depot

Notification App Backend (Port 4000)
Method	Endpoint	Description
GET	/health	Health check
GET	/notifications	All notifications
GET	/notifications/priority?n=10	Top N priority notifications (default: 10)

System Design

The full system design covering all six stages — REST API contract, database schema, query optimisation, caching strategy, async fan-out architecture, and Priority Inbox approach — is documented in notification_system_design.md.

Output Screenshots

Stage 6 output screenshots showing priority notification results are in notification_app_be/screenshots/.

API response screenshots (Postman/Insomnia) for the Vehicle Scheduler are in vehicle_scheduling/screenshots/.
