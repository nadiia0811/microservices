import dotenv from "dotenv";
import logger from "./utils/logger";
import mongoose from "mongoose";
import path from "path";
import express, { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import { RateLimiterRedis } from "rate-limiter-flexible";
import Redis from "ioredis";
import router from "./routes/identity-service";
import errorHandler from "./middleware/errorHandler";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

mongoose
  .connect(process.env.MONGODB_URL!)
  .then(() => logger.info("Connected to MongoDB"))
  .catch((err: Error) => logger.error("Database connection error", err));

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(helmet());
app.use(cors());

app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`Received ${req.method} to ${req.url}`);
  logger.info(`Request body: ${req.body}`);
  next();
});

const redisClient = new Redis(process.env.REDIS_URL!);

const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "middleware",
  points: 10,
  duration: 1,
});

app.use((req: Request, res: Response, next: NextFunction) => {
  rateLimiter
    .consume(req.ip!)
    .then(() => next())
    .catch(() => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({
        success: false,
        message: "Too many requests",
      });
    });

});

const sensitiveEndpointsLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "sensitive",
  points: 1,
  duration: 1,
});

const rateLimitMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  sensitiveEndpointsLimiter
    .consume(req.ip!)
    .then(() => next())
    .catch(() => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
      res.status(409).json({
        success: false,
        message: "Too many requests",
      });
    });
};

app.use("/api/auth/register", rateLimitMiddleware);
app.use("/api/auth", router);
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Identity-service is running on port: ${PORT}`);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error(`Unhandled rejection at: `, promise, " reason: ", reason);
});
