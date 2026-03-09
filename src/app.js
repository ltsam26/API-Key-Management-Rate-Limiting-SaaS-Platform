const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");

dotenv.config();

const app = express();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per window
  message: "Too many auth attempts, try later"
});
// Middlewares
app.use(cors({
  origin: "http://localhost:3000", // change later for frontend
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization", "x-api-key"]
}));
app.use(express.json());
app.use(morgan("dev"));
app.use(helmet());

// Health check route (important for deployment later)
app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "API Platform Backend Running",
  });
});

// auth routes
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const projectRoutes = require("./routes/project.routes");
const apiKeyRoutes = require("./routes/apikey.routes");
const publicRoutes = require("./routes/public.routes");
const analyticsRoutes = require("./routes/analytics.routes");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
const adminRoutes = require("./routes/admin.routes");



app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/keys", apiKeyRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/auth", authLimiter);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/admin", adminRoutes);


module.exports = app;