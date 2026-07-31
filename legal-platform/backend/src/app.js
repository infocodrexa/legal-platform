const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

const env = require("./config/env");
const routes = require("./routes");
const paymentController = require("./controllers/payment.controller");
const seoController = require("./controllers/seo.controller");
const { generalLimiter } = require("./middlewares/rateLimiter");
const { notFound, errorHandler } = require("./middlewares/errorHandler");

const app = express();

// Trust the first proxy hop (Render/behind a load balancer) so req.ip and
// secure cookies behave correctly.
app.set("trust proxy", 1);

// This is a pure JSON API — it never serves HTML/CSS/JS/images itself
// (all file content is either JSON or a redirect to a signed S3 URL), so a
// maximally strict CSP costs nothing and closes off any XSS payload that
// somehow ended up reflected in a response from doing anything in a
// browser context.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginResourcePolicy: { policy: "same-site" },
  })
);
app.use(
  cors({
    origin: env.CORS_ORIGIN.split(",").map((o) => o.trim()),
    credentials: true,
  })
);

// IMPORTANT: the Razorpay webhook must be mounted with express.raw() BEFORE
// express.json() below — HMAC signature verification needs the exact raw
// request bytes, not a re-serialized JSON.parse() of them. This route is
// deliberately not declared in routes/payment.routes.js for that reason.
app.post("/api/v1/payments/webhook", express.raw({ type: "application/json" }), paymentController.webhook);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());
app.use(morgan(env.NODE_ENV === "development" ? "dev" : "combined"));

app.use(generalLimiter);

app.get("/health", (req, res) => {
  res.status(200).json({ success: true, message: "OK", env: env.NODE_ENV, uptime: process.uptime() });
});

// Crawlers expect these at the site root, not under /api/v1.
app.get("/sitemap.xml", seoController.sitemap);
app.get("/robots.txt", seoController.robots);

app.use("/api/v1", routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
