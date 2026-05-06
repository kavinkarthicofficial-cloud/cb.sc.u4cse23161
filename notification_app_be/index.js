

const express = require("express");
const axios = require("axios");
const { Log, getToken } = require("logging-middleware");
const { MinHeap } = require("./priorityHeap");

const path = require("path");
const app = express();
const PORT = 4000;

app.use(express.json());


app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});


app.use("/screenshots", express.static(path.join(__dirname, "screenshots")));

const BASE_URL = "http://20.207.122.201/evaluation-service";


const TYPE_WEIGHTS = {
  Placement: 3,
  Result: 2,
  Event: 1,
};


async function fetchNotifications() {
  try {
    const token = await getToken();
    await Log("backend", "info", "service", "Fetching notifications");

    const response = await axios.get(`${BASE_URL}/notifications`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    await Log("backend", "info", "service", `Fetched ${response.data.notifications.length} notifications`);
    return response.data.notifications;
  } catch (error) {
    const errMsg = error.response
      ? `Failed to fetch notifications: ${error.response.status}`
      : `Failed to fetch notifications: ${error.message}`;
    await Log("backend", "error", "service", errMsg.slice(0, 48));
    throw new Error(errMsg);
  }
}


function calculatePriorityScore(notification, referenceTime) {
  const typeWeight = TYPE_WEIGHTS[notification.Type] || 0;
  const timestamp = new Date(notification.Timestamp).getTime();
  const refTime = referenceTime.getTime();



  const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days in ms
  const age = Math.max(0, refTime - timestamp);
  const recencyScore = Math.max(0, 1 - age / maxAge);


  return typeWeight * 1000 + recencyScore * 999;
}


function getTopNPriority(notifications, topN) {
  const heap = new MinHeap(topN);
  const referenceTime = new Date();

  for (const notification of notifications) {
    const score = calculatePriorityScore(notification, referenceTime);
    heap.insert({
      ...notification,
      score,
      typeWeight: TYPE_WEIGHTS[notification.Type] || 0,
    });
  }


  return heap.getSorted();
}


app.get("/notifications/priority", async (req, res) => {
  try {
    const topN = parseInt(req.query.n, 10) || 10;
    await Log("backend", "info", "handler", `Fetching top ${topN} priority notifications`);

    const notifications = await fetchNotifications();
    const topNotifications = getTopNPriority(notifications, topN);

    await Log("backend", "info", "handler", `Returning ${topNotifications.length} priority items`);

    res.status(200).json({
      success: true,
      topN,
      totalNotifications: notifications.length,
      priorityInbox: topNotifications.map((n, index) => ({
        rank: index + 1,
        id: n.ID,
        type: n.Type,
        typeWeight: n.typeWeight,
        message: n.Message,
        timestamp: n.Timestamp,
        priorityScore: Math.round(n.score * 100) / 100,
      })),
    });
  } catch (error) {
    await Log("backend", "error", "handler", `priority failed: ${error.message}`.slice(0, 48));
    res.status(500).json({
      success: false,
      error: "Failed to fetch priority notifications",
      details: error.message,
    });
  }
});


app.get("/notifications", async (req, res) => {
  try {
    await Log("backend", "info", "handler", "Fetching all notifications");
    const notifications = await fetchNotifications();

    res.status(200).json({
      success: true,
      total: notifications.length,
      notifications,
    });
  } catch (error) {
    await Log("backend", "error", "handler", `notifications failed: ${error.message}`.slice(0, 48));
    res.status(500).json({
      success: false,
      error: "Failed to fetch notifications",
      details: error.message,
    });
  }
});


app.get("/health", async (req, res) => {
  await Log("backend", "debug", "handler", "Health check requested");
  res.status(200).json({ status: "healthy", service: "notification-app-be" });
});


app.listen(PORT, async () => {
  await Log("backend", "info", "config", `Notification App on port ${PORT}`);
});
