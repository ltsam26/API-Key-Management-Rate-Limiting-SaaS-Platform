const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

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


app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/keys", apiKeyRoutes);
app.use("/api/public", publicRoutes);

module.exports = app;