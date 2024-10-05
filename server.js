"use strict";

const app = require("./app");
const { PORT } = require("./config");

const server = app.listen(PORT, function () {
  console.log(`Started on http://localhost:${PORT}`);
});

module.exports = server;