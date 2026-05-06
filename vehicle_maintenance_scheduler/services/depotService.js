

const axios = require("axios");
const { Log, getToken } = require("logging-middleware");

const BASE_URL = "http://20.207.122.201/evaluation-service";


async function fetchDepots() {
  try {
    const token = await getToken();
    await Log("backend", "info", "service", "Fetching depot data");

    const response = await axios.get(`${BASE_URL}/depots`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    await Log("backend", "info", "service", `Fetched ${response.data.depots.length} depots`);
    return response.data.depots;
  } catch (error) {
    const errMsg = error.response
      ? `Failed to fetch depots: ${error.response.status}`
      : `Failed to fetch depots: ${error.message}`;
    await Log("backend", "error", "service", errMsg.slice(0, 48));
    throw new Error(errMsg);
  }
}


async function fetchVehicles() {
  try {
    const token = await getToken();
    await Log("backend", "info", "service", "Fetching vehicle data");

    const response = await axios.get(`${BASE_URL}/vehicles`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    await Log("backend", "info", "service", `Fetched ${response.data.vehicles.length} vehicles`);
    return response.data.vehicles;
  } catch (error) {
    const errMsg = error.response
      ? `Failed to fetch vehicles: ${error.response.status}`
      : `Failed to fetch vehicles: ${error.message}`;
    await Log("backend", "error", "service", errMsg.slice(0, 48));
    throw new Error(errMsg);
  }
}

module.exports = { fetchDepots, fetchVehicles };
