import { Request, Response } from "express";
import { asyncHandler } from "../../utils/async.js";
import { AuthenticationService } from "./Auth.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { SessionService } from "../../utils/Session.js";
import { SessionPayload } from "../../interface/session.interface.js";
import { ROLE_PERMISSIONS } from "../../types/permission.js";
import { UserRole } from "../../types/general.js";
import { ClientType } from "../../utils/getClient.js";

export class AuthController {
  private static handleLoginPipeline = (clientSource: ClientType) => {
    return asyncHandler(async (req: Request, res: Response) => {
      const { email, password } = req.body;

      const userWithoutPassword = await AuthenticationService.login(
        email,
        password,
      );

      const expectedClient =
        userWithoutPassword.role === "ADMIN" ||
        userWithoutPassword.role === "SUPER_ADMIN"
          ? "ADMIN"
          : "MOBILE";

      if (clientSource !== expectedClient) {
        res
          .status(403)
          .json(
            new ApiResponse(
              403,
              null,
              `Forbidden: Channel mismatch for role [${userWithoutPassword.role}]`,
            ),
          );
        return;
      }

      const sessionPayload: SessionPayload = {
        userId: userWithoutPassword.id,
        email: userWithoutPassword.email,
        role: userWithoutPassword.role as UserRole,
        permissions:
          userWithoutPassword.role === "ADMIN"
            ? ROLE_PERMISSIONS.ADMIN
            : userWithoutPassword.role === "SUPER_ADMIN"
              ? ROLE_PERMISSIONS.SUPER_ADMIN
              : ROLE_PERMISSIONS.USER,
        client: clientSource,
      };

      await SessionService.signTo(res, sessionPayload, clientSource);
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            userWithoutPassword,
            "User logged in successfully",
          ),
        );
    });
  };

  static register = asyncHandler(async (req: Request, res: Response) => {
    const response = await AuthenticationService.registerUser(req.body);
    res
      .status(201)
      .json(new ApiResponse(201, response, "User registered successfully"));
  });

  static loginMobile = AuthController.handleLoginPipeline("MOBILE");

  static loginAdmin = AuthController.handleLoginPipeline("ADMIN");

  static logout = asyncHandler(async (req: Request, res: Response) => {
    await AuthenticationService.logout(res, req);
    res
      .status(200)
      .json(new ApiResponse(200, null, "User logged out successfully"));
  });
  static getAuthenticatedUser = asyncHandler(
    async (req: Request, res: Response) => {
      const userWithoutPassword =
        await AuthenticationService.getAuthenticatedUser(req);
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            userWithoutPassword,
            "Authenticated user retrieved successfully",
          ),
        );
    },
  );
}
