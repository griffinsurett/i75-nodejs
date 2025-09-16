// backend/shared/middleware/bodyParser.js
const express = require("express");

const bodyParserMiddleware = () => {
  return [
    express.json({
      limit: process.env.JSON_LIMIT || "10mb",
      type: ["application/json", "text/*"],
    }),
    express.urlencoded({
      extended: true,
      limit: process.env.URL_ENCODED_LIMIT || "10mb",
      type: ["application/x-www-form-urlencoded"],
    }),
  ];
};

module.exports = bodyParserMiddleware;