const fs = require("fs");
const path = require("path");

// Log file path
const logFilePath = path.join(__dirname, "logs.txt");

const logger = (req, res, next) => {
  const log = `
[${new Date().toISOString()}]
IP: ${req.ip}
Method: ${req.method}
URL: ${req.originalUrl}
----------------------------------------
`;

  // Append log to file
  fs.appendFile(logFilePath, log, (err) => {
    if (err) console.error("Log Error:", err);
  });

  next();
};

module.exports = logger;