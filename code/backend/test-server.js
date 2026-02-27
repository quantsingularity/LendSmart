require("dotenv").config();
process.env.SKIP_DB_CONNECTION = "true";
process.env.NODE_ENV = "test";

console.log("Testing server imports...");

try {
  const express = require("express");
  console.log("✓ Express loaded");

  const { logger } = require("./src/utils/logger");
  console.log("✓ Logger loaded");

  const { databaseManager } = require("./src/config/database");
  console.log("✓ Database manager loaded");

  const { getAuditLogger } = require("./src/compliance/auditLogger");
  console.log("✓ Audit logger loaded");

  const authRoutes = require("./src/routes/authRoutes");
  console.log("✓ Auth routes loaded");

  const adminRoutes = require("./src/routes/adminRoutes");
  console.log("✓ Admin routes loaded");

  console.log("\n✅ All core modules loaded successfully!");
  process.exit(0);
} catch (error) {
  console.error("\n❌ Error loading modules:", error.message);
  console.error(error.stack);
  process.exit(1);
}
