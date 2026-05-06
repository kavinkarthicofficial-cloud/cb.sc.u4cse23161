

const express = require("express");
const { Log } = require("logging-middleware");
const { fetchDepots, fetchVehicles } = require("./services/depotService");
const { knapsack } = require("./knapsack");

const path = require("path");
const app = express();
const PORT = 3000;

app.use(express.json());


app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});


app.use("/screenshots", express.static(path.join(__dirname, "screenshots")));


app.get("/schedule", async (req, res) => {
  try {
    await Log("backend", "info", "handler", "GET /schedule - fetching all depots");


    const [depots, vehicles] = await Promise.all([
      fetchDepots(),
      fetchVehicles(),
    ]);

    await Log("backend", "info", "handler", `Processing ${depots.length} depots, ${vehicles.length} tasks`);


    const schedules = depots.map((depot) => {
      const result = knapsack(vehicles, depot.MechanicHours);

      return {
        depotId: depot.ID,
        mechanicHoursAvailable: depot.MechanicHours,
        mechanicHoursUsed: result.totalDuration,
        mechanicHoursRemaining: result.remainingCapacity,
        totalImpactScore: result.totalImpact,
        tasksSelected: result.selectedTasks.length,
        tasks: result.selectedTasks.map((task) => ({
          taskId: task.TaskID,
          duration: task.Duration,
          impact: task.Impact,
        })),
      };
    });

    await Log("backend", "info", "handler", `Computed ${schedules.length} depot schedules`);

    res.status(200).json({
      success: true,
      totalDepots: schedules.length,
      schedules,
    });
  } catch (error) {
    await Log("backend", "error", "handler", `schedule failed: ${error.message}`.slice(0, 48));
    res.status(500).json({
      success: false,
      error: "Failed to compute maintenance schedule",
      details: error.message,
    });
  }
});


app.get("/schedule/:depotId", async (req, res) => {
  const depotId = parseInt(req.params.depotId, 10);

  try {
    await Log("backend", "info", "handler", `Fetching schedule for depot ${depotId}`);

    if (isNaN(depotId)) {
      await Log("backend", "warn", "handler", `Invalid depot ID: ${req.params.depotId}`);
      return res.status(400).json({
        success: false,
        error: "Invalid depot ID. Must be a number.",
      });
    }

    const [depots, vehicles] = await Promise.all([
      fetchDepots(),
      fetchVehicles(),
    ]);

    const depot = depots.find((d) => d.ID === depotId);
    if (!depot) {
      await Log("backend", "warn", "handler", `Depot ${depotId} not found`);
      return res.status(404).json({
        success: false,
        error: `Depot with ID ${depotId} not found`,
      });
    }

    const result = knapsack(vehicles, depot.MechanicHours);

    const schedule = {
      depotId: depot.ID,
      mechanicHoursAvailable: depot.MechanicHours,
      mechanicHoursUsed: result.totalDuration,
      mechanicHoursRemaining: result.remainingCapacity,
      totalImpactScore: result.totalImpact,
      tasksSelected: result.selectedTasks.length,
      tasks: result.selectedTasks.map((task) => ({
        taskId: task.TaskID,
        duration: task.Duration,
        impact: task.Impact,
      })),
    };

    await Log("backend", "info", "handler", `Depot ${depotId}: ${result.selectedTasks.length} tasks, impact ${result.totalImpact}`);

    res.status(200).json({
      success: true,
      schedule,
    });
  } catch (error) {
    await Log("backend", "error", "handler", `depot ${depotId} failed: ${error.message}`.slice(0, 48));
    res.status(500).json({
      success: false,
      error: "Failed to compute maintenance schedule",
      details: error.message,
    });
  }
});


app.get("/health", async (req, res) => {
  await Log("backend", "debug", "handler", "Health check requested");
  res.status(200).json({ status: "healthy", service: "vehicle-maintenance-scheduler" });
});


app.listen(PORT, async () => {
  await Log("backend", "info", "config", `Vehicle Scheduler on port ${PORT}`);
});
