import { Request, Response } from "express";
import logger from "../utils/logger";
import CustomError from "../utils/customError";

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


export default errorHandler;
