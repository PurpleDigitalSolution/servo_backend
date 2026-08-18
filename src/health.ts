import { Request, Response } from "express";
export const healthCheck = (req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    message: "API is healthy",
  });
};

export const ping = (req: Request, res: Response) => {
  res.status(200).json({
    message: "pong",
  });
};
