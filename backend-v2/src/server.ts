import app from "./app";
import { config } from "./config";

app.listen(config.port, () => {
  console.log(`[PCCP v2] Server running on port ${config.port}`);
  console.log(`[PCCP v2] Health check: http://localhost:${config.port}/api/health`);
  console.log(`[PCCP v2] API base: http://localhost:${config.port}/api/v1`);
});
