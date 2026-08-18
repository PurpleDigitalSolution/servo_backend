import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/errorHandler.js";

export const authorize = (requiredRoles: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;
    if (!user) {
      return next(new ApiError(401, "Unauthorized - No user session found"));
    }
    const allowedRoles = Array.isArray(requiredRoles)
      ? requiredRoles
      : [requiredRoles];
    const isSuspended =
      user.accountStatus === "SUSPENDED" || user.accountStatus === "BANNED";
    if (isSuspended) {
      return next(
        new ApiError(
          403,
          "Forbidden - Your account is suspended. Please contact support for assistance.",
        ),
      );
    }
    const hasRole =
      allowedRoles.includes(user.role) || user.role === "SUPER_ADMIN"; // SUPER_ADMIN has access to all routes
    if (!hasRole) {
      return next(
        new ApiError(
          403,
          "Forbidden - You do not have permission to access this resource",
        ),
      );
    }
    next();
  };
};

export const authorizePermission = (requiredPermissions: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user) {
      throw new ApiError(401, "Unauthorized - No user session found");
    }

    // Bypass check immediately for SUPER_ADMIN
    if (user.role === "SUPER_ADMIN") {
      return next();
    }

    // 1. Normalize required permissions array & trim whitespace
    const requiredList = (
      Array.isArray(requiredPermissions)
        ? requiredPermissions
        : [requiredPermissions]
    ).map((p) => String(p).trim().toUpperCase());

    // 2. Safely extract user permissions (handles both string[] and object[])
    const rawUserPermissions: unknown = user.permissions ?? [];

    let userPermsList: string[] = [];

    if (Array.isArray(rawUserPermissions)) {
      userPermsList = rawUserPermissions.map((item) => {
        if (typeof item === "string") {
          return item.trim().toUpperCase();
        }
        if (typeof item === "object" && item !== null) {
          // Extracts permission name if stored as object like { name: "ORDER_READ" } or { permission: "ORDER_READ" }
          const obj = item as Record<string, unknown>;
          return String(obj.name || obj.permission || obj.code || "")
            .trim()
            .toUpperCase();
        }
        return String(item).trim().toUpperCase();
      });
    }

    // 3. Perform match check (OR logic with .some)
    const hasPermission = requiredList.some((requiredPerm) =>
      userPermsList.includes(requiredPerm),
    );

    if (!hasPermission) {
      throw new ApiError(
        403,
        "Forbidden - You do not have permission to access this resource",
      );
    }

    next();
  };
};

export const requirePasswordChange = () => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;

    if (user && user.mustChangePassword) {
      // Use originalUrl or check trailing paths to ensure sub-routers don't break the check
      const currentPath = req.originalUrl.split("?")[0]; // Strip query parameters if any

      const allowedPaths = [
        "/auth/change-password",
        "/auth/logout",
        "/api/v1/auth/change-password", // Or check via .endsWith()
        "/api/v1/auth/logout",
      ];

      const isAllowedRoute =
        allowedPaths.some((path) => currentPath === path) ||
        currentPath.endsWith("/change-password") ||
        currentPath.endsWith("/logout");

      if (!isAllowedRoute) {
        throw new ApiError(
          403,
          "Forbidden - You must change your password before proceeding",
        );
      }
    }

    next();
  };
};
