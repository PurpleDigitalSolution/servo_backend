import { NextFunction, Request, Response } from "express";
import { prisma } from "../config/database.js";

import { generateRequestHash } from "../utils/request.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const checkIdempotency = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = req.header("X-Idempotency-Key");

    if (req.method !== "POST") return next();
    if (!key) return next();

    const route = req.path;
    const userId = req.user?.userId;
    const requestHash = generateRequestHash(req);

    let record;

    // 1. Try to reserve request

    try {
      record = await prisma.idempotencyRequest.create({
        data: {
          key,
          route,
          userId,
          requestHash,
          status: "PROCESSING",
          lockedAt: new Date(),
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });
    } catch {
      record = await prisma.idempotencyRequest.findUnique({
        where: {
          key_route: { key, route },
        },
      });

      if (!record) return next();

      // 2. COMPLETED → return cached response

      if (record.status === "COMPLETED") {
        return res
          .status(200)
          .json(
            new ApiResponse(
              200,
              record.response,
              "Request executed successfully",
            ),
          );
      }

      // 3. PROCESSING → check stale

      if (record.status === "PROCESSING") {
        const isStale =
          record.lockedAt &&
          Date.now() - new Date(record.lockedAt).getTime() > 2 * 60 * 1000;

        if (!isStale) {
          return res
            .status(409)
            .json(new ApiResponse(409, null, "Request already in progress"));
        }

        // stale → mark failed and allow retry
        record.status = "FAILED";

        await prisma.idempotencyRequest.update({
          where: { id: record.id },
          data: { status: "FAILED" },
        });
      }

      // 4. FAILED → validate + retry

      if (record.status === "FAILED") {
        if (record.requestHash !== requestHash) {
          return res
            .status(400)
            .json(
              new ApiResponse(400, null, "Request payload mismatch for retry"),
            );
        }

        await prisma.idempotencyRequest.update({
          where: { id: record.id },
          data: {
            status: "PROCESSING",
            lockedAt: new Date(),
          },
        });
      }
    }

    // 5. Final safety check

    if (record.requestHash !== requestHash) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            null,
            "Request data does not match original request",
          ),
        );
    }

    res.locals.idempotencyRecord = record;

    // 6. Capture response

    const originalJson = res.json.bind(res);

    res.json = (body) => {
      res.locals.responseBody = body;
      return originalJson(body);
    };

    // 7. Persist result AFTER response

    res.on("finish", async () => {
      const idempotencyRecord = res.locals.idempotencyRecord;
      const status =
        res.statusCode >= 200 && res.statusCode < 300 ? "COMPLETED" : "FAILED";

      if (!idempotencyRecord) return;

      await prisma.idempotencyRequest.update({
        where: { id: idempotencyRecord.id },
        data: {
          status: status,
          response: res.locals.responseBody,
          completedAt: new Date(),
        },
      });
    });

    next();
  };
};
