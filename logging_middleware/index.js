

const axios = require("axios");
const config = require("./config");


let cachedToken = null;
let tokenExpiresAt = 0;


async function getAuthToken() {
  const now = Math.floor(Date.now() / 1000);


  if (cachedToken && tokenExpiresAt > now + 60) {
    return cachedToken;
  }

  try {
    const response = await axios.post(`${config.baseUrl}/auth`, {
      email: config.credentials.email,
      name: config.credentials.name,
      rollNo: config.credentials.rollNo,
      accessCode: config.credentials.accessCode,
      clientID: config.credentials.clientID,
      clientSecret: config.credentials.clientSecret,
    });

    cachedToken = response.data.access_token;
    tokenExpiresAt = response.data.expires_in;

    return cachedToken;
  } catch (error) {
    const errMsg = error.response
      ? `Auth failed: ${error.response.status} - ${JSON.stringify(error.response.data)}`
      : `Auth failed: ${error.message}`;
    throw new Error(errMsg);
  }
}


function validateParams(stack, level, pkg, message) {
  if (!config.allowedStacks.includes(stack)) {
    throw new Error(
      `Invalid stack: "${stack}". Allowed: ${config.allowedStacks.join(", ")}`
    );
  }
  if (!config.allowedLevels.includes(level)) {
    throw new Error(
      `Invalid level: "${level}". Allowed: ${config.allowedLevels.join(", ")}`
    );
  }
  if (!config.allowedPackages[stack].includes(pkg)) {
    throw new Error(
      `Invalid package: "${pkg}" for stack "${stack}". Allowed: ${config.allowedPackages[stack].join(", ")}`
    );
  }
  if (!message || typeof message !== "string" || message.trim() === "") {
    throw new Error("Message must be a non-empty string.");
  }
}


async function Log(stack, level, pkg, message) {

  validateParams(stack, level, pkg, message);

  try {
    const token = await getAuthToken();

    const response = await axios.post(
      `${config.baseUrl}/logs`,
      {
        stack: stack,
        level: level,
        package: pkg,
        message: message,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {

    if (error.message && error.message.startsWith("Invalid")) {
      throw error;
    }

    const errMsg = error.response
      ? `Log API failed: ${error.response.status} - ${JSON.stringify(error.response.data)}`
      : `Log API failed: ${error.message}`;



    console.error(`[LoggingMiddleware] ${errMsg}`);
    return null;
  }
}


async function getToken() {
  return getAuthToken();
}

module.exports = { Log, getToken };
