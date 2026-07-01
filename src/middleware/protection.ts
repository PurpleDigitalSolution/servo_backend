import { Request, Response, NextFunction } from "express";
import { SessionService } from "../utils/Session.js";

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await SessionService.verifySession(req, res, next);
  } catch (error) {
    next(error);
  }
};
