

const config = {
  baseUrl: "http://20.207.122.201/evaluation-service",

  credentials: {
    email: "cb.sc.u4cse23161@cb.students.amrita.edu",
    name: "kavin karthic m",
    rollNo: "cb.sc.u4cse23161",
    accessCode: "PTBMmQ",
    clientID: "86264d7a-e1da-4fbb-919f-6a7e050d47b3",
    clientSecret: "bDCKGshxSePCvdxX",
  },


  allowedStacks: ["backend", "frontend"],
  allowedLevels: ["debug", "info", "warn", "error", "fatal"],
  allowedPackages: {
    backend: [
      "cache", "controller", "cron_job", "db", "domain",
      "handler", "repository", "route", "service",
      "auth", "config", "middleware", "utils",
    ],
    frontend: [
      "api", "component", "hook", "page", "state", "style",
      "auth", "config", "middleware", "utils",
    ],
  },
};

module.exports = config;
