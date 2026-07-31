const env = require("../config/env");

const FRIENDLY_BY_STATUS = {
  400: "Please check the information you entered and try again.",
  401: "Your session has expired. Please sign in again.",
  403: "You do not have permission to perform this action.",
  404: "The requested information could not be found.",
  409: "This request conflicts with an existing record.",
  413: "The selected file is too large.",
  422: "Some information is invalid. Please review the highlighted fields.",
  429: "Too many attempts. Please wait a moment and try again.",
  500: "Something went wrong. Please try again later.",
  502: "A connected service is temporarily unavailable. Please try again.",
  503: "This service is temporarily unavailable. Please try again shortly.",
};

const notFound = (req, res) => {
  res.status(404).json({ success: false, message: "The requested page or service could not be found." });
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode && err.isOperational ? err.statusCode : 500;
  let message = err.isOperational ? err.message : FRIENDLY_BY_STATUS[statusCode];
  let details = err.details;

  if (err.code === "P2002") {
    statusCode = 409;
    message = "This information is already in use.";
    details = { fields: err.meta?.target || [] };
  } else if (err.code === "P2025") {
    statusCode = 404;
    message = "The requested record could not be found.";
  } else if (err.name === "MulterError") {
    statusCode = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    message = err.code === "LIMIT_FILE_SIZE" ? FRIENDLY_BY_STATUS[413] : "The file could not be uploaded. Please try another file.";
  } else if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    statusCode = 401;
    message = FRIENDLY_BY_STATUS[401];
  }

  if (!err.isOperational || statusCode >= 500) {
    console.error(`[${req.method} ${req.originalUrl}]`, err);
  }

  const body = { success: false, message: message || FRIENDLY_BY_STATUS[statusCode] || FRIENDLY_BY_STATUS[500] };
  if (details) body.details = details;
  if (env.NODE_ENV === "development" && !err.isOperational) body.stack = err.stack;
  res.status(statusCode).json(body);
};

module.exports = { notFound, errorHandler };
