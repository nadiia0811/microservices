require("../utils/logger");
import { Request, Response } from "express";

interface CustomError extends Error {
  status?: number
}

const errorHandler = (
    err: CustomError, 
    request: Request, 
    response: Response,
    next: Function
) => {
  logger.error(err.stack);
  response.status(err.status || 500)
          .json({
            message: err.message || "Internal server error"
          });
};

module.exports = errorHandler;
