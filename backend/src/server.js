require("./config/db");
const app = require("./app");

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is missing in environment variables");
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  const logger = require("./utils/logger");

logger.info(`Server running on port ${PORT}`);
});
