import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import Redis from "ioredis";
import logger from "./utils/logger";
import proxy from "express-http-proxy";
import { RequestOptions } from "https";
import errorHandler from "./middleware/errorHandler";

const app = express();
const PORT = process.env.PORT || 3000;
dotenv.config();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(errorHandler);

const redisClient = new Redis(process.env.REDIS_URL!);

const proxyOptions = {
  proxyReqPathResolver: (req: Request) => {
    return req.originalUrl.replace(/^\/v1/, "/api");
  },
  proxyErrorHandler: (err: Error, res: Response, next: NextFunction) => {
    logger.error(`Proxy error: ${err.message}`);
    res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  },
};

app.use(
  "/v1/auth",
  proxy(process.env.IDENTITY_SERVICE_URL!, {
    ...proxyOptions,
    proxyReqOptDecorator: (
      proxyReqOpts: RequestOptions,
      srcReq: Request
    ): RequestOptions => {
      proxyReqOpts.headers = {
        ...proxyReqOpts.headers,
        "Content-Type": "application/json",
      };

      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq) => {
      logger.info(
        `Received response from identity-service: ${proxyRes.statusCode}`);
        return proxyResData;
    }
  })
);

app.listen(PORT, () => {
  logger.info(`Api Gateway is running on port ${PORT}`);
  logger.info(`Identity service is running on port ${process.env.IDENTITY_SERVICE_URL}`);
})
