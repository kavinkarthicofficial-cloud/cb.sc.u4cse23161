
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

cd vehicle_maintenance_scheduler && npm start


cd notification_app_be && npm start
```


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

Stage 6 output screenshots showing priority notification results are priority_inbox_output_postman.png.





<img width="832" height="848" alt="priority_inbox_output_postman" src="https://github.com/user-attachments/assets/42ed6258-9190-429b-a239-cc64cc3f34ca" />

API response screenshots (Postman) for the Vehicle Scheduler are vehicle_scheduler_output_postman.png

<img width="830" height="885" alt="vehicle_scheduler_output_postman" src="https://github.com/user-attachments/assets/325d2ffc-e3fc-40c8-8df9-703880ed589f" />



Local host output for priority inbox

<img width="1401" height="803" alt="priority_inbox_output" src="https://github.com/user-attachments/assets/18d7eaf6-a07e-4bcf-b6a1-daeefd809ca3" />

Local host output for vehicle scheduler

<img width="1396" height="796" alt="vehicle_scheduler_output" src="https://github.com/user-attachments/assets/0c6f0717-bf4c-409b-8ece-0aa3f7119569" />

