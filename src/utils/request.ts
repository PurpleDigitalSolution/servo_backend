import crypto from "crypto";
import { Request } from "express";

export function generateRequestHash(req: Request) {
  return crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        body: req.body,
        method: req.method,
        path: req.path,
        userId: req.user?.userId,
      }),
    )
    .digest("hex");
}
