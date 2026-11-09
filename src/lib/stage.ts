import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

// Pages caches the stage script for ten minutes, so its address changes with its content.
export const stageVersion = createHash("sha1")
  .update(readFileSync("public/assets/string-stage.js"))
  .digest("hex")
  .slice(0, 10);
