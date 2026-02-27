#!/usr/bin/env node

/**
 * Standalone start script for LendSmart backend
 * This script can start the server with or without databases for testing
 */

require("dotenv").config();

const mode = process.argv[2] || "full";

console.log(`Starting LendSmart backend in ${mode} mode...`);

if (mode === "standalone") {
  // Start in standalone mode without database dependencies
  console.log("Standalone mode: Starting without database connections...");
  process.env.SKIP_DB_CONNECTION = "true";
}

// Start the server
require("./src/server");
