const { exec } = require('child_process');
const path = require('path');

const startRssFetchJob = () => {
  // Absolute path to the python script
  const scriptPath = path.join(__dirname, '../../data/fetch_rss.py');

  const runPythonScript = () => {
    console.log(`[Cron] Executing RSS Fetch Script at ${new Date().toISOString()}`);
    exec(`python "${scriptPath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`[Cron Error]: ${error.message}`);
        return;
      }
      if (stderr) {
        // Python might output informational logs to stderr, still log it but as warn
        console.warn(`[Cron Stderr]: ${stderr}`);
      }
      console.log(`[Cron Success Output]:\n${stdout}`);
    });
  };

  // Optional: Run it immediately once on startup so data is populated right away
  runPythonScript();

  // Run every 1 hour (60 minutes * 60 seconds * 1000 milliseconds)
  const ONE_HOUR = 60 * 60 * 1000;
  setInterval(runPythonScript, ONE_HOUR);
  
  console.log(`[Cron] RSS Fetch Job scheduled to run every 1 hour.`);
};

module.exports = startRssFetchJob;
