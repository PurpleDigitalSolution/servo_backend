import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/errorHandler.js";
import { Permission } from "../generated/prisma/browser.js";
export const authorize = (requiredRoles: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;
    if (!user) {
      return next(new ApiError(401, "Unauthorized - No user session found"));
    }
    const allowedRoles = Array.isArray(requiredRoles)
      ? requiredRoles
      : [requiredRoles];

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
    const allowedPermissions = Array.isArray(requiredPermissions)
      ? requiredPermissions
      : [requiredPermissions];
    const hasPermission = allowedPermissions.every((perm) =>
      user.permissions?.includes(perm as Permission),
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
