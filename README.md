# cb.sc.u4cse23161

## Project Structure

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

## Setup

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

## API Endpoints

### Vehicle Maintenance Scheduler (Port 3000)
- `GET /schedule` — Optimal maintenance schedule for all depots
- `GET /schedule/:depotId` — Schedule for a specific depot
- `GET /health` — Health check

### Notification App Backend (Port 4000)
- `GET /notifications/priority?n=10` — Top N priority notifications
- `GET /notifications` — All notifications
- `GET /health` — Health check
