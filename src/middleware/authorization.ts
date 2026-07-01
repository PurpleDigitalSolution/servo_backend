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
    const hasRole = allowedRoles.includes(user.role);
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
