import dotenv from "dotenv";
dotenv.config();

import { createServer } from "http";
import app from "./app.js";

import { syncCallLogsInternal } from "./jobs/syncCallLogs.js";
import { initFacebookCron, initInstagramCron } from "./jobs/instagramScheduler.js";
import { initSocket } from "./socket/socket.js";
import { deleteOldNotifications, initFollowupNotificationCron } from "./jobs/notification/notificationEvents.js";

initInstagramCron();
initFacebookCron();

const PORT = process.env.PORT || 5000;

// wrap app in an HTTP server, then hand it to socket.io
const server = createServer(app);
initSocket(server);

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  setInterval(async () => {
    try {
      await syncCallLogsInternal();
    } catch (err) {
      console.error("Sync error:", err);
    }
  }, 10000);

    // notification cleanup every 24 hours
  setInterval(async () => {
    try {
      await deleteOldNotifications();
    } catch (err) {
      console.error("Notification cleanup error:", err);
    }
  }, 24 * 60 * 60 * 1000); // 24 hours in milliseconds

 // new followup cron
  initFollowupNotificationCron();
});