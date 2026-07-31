const http = require("http");
const app = require("./app");
const env = require("./config/env");
const prisma = require("./config/db");
const { startReminderCron, stopReminderCron } = require("./services/reminderCron");
const { initSocket } = require("./realtime/socket");
const { verifyBucketIsPrivate } = require("./utils/s3BucketCheck");

let server;
let io;

async function start() {
  try {
    await prisma.$connect();
    console.log("✅ Connected to database");

    // Best-effort, non-fatal — see s3BucketCheck.js. A misconfigured storage bucket
    // is a serious problem but shouldn't take the whole server down; it
    // logs loudly instead so it gets caught in deploy logs/monitoring.
    verifyBucketIsPrivate().catch((err) => console.warn("Storage bucket check errored:", err.message));

    // Express needs an explicit http.Server (rather than app.listen()'s
    // implicit one) so Socket.io can attach to the same underlying server
    // and share the port — REST and WebSocket traffic both flow through this.
    server = http.createServer(app);
    io = initSocket(server);

    server.listen(env.PORT, () => {
      console.log(`🚀 Server listening on port ${env.PORT} [${env.NODE_ENV}]`);
      console.log(`🔌 Socket.io ready on the same port (namespace: /)`);
    });

    startReminderCron();
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

async function shutdown(signal) {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  stopReminderCron();
  if (io) io.close();
  if (server) {
    server.close(async () => {
      await prisma.$disconnect();
      console.log("Server closed. Bye.");
      process.exit(0);
    });
  } else {
    await prisma.$disconnect();
    process.exit(0);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

start();
