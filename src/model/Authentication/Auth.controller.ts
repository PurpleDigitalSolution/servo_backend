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
  // Inject AuthenticationService dependency through constructor
  constructor(
    private readonly authService: AuthenticationService,
    private readonly sessionService: typeof SessionService = SessionService,
  ) {}

  /**
   * Generates localized login processing pipelines mapped to target clients (e.g., MOBILE or ADMIN).
   */
  private handleLoginPipeline(clientSource: ClientType) {
    return asyncHandler(async (req: Request, res: Response) => {
      const { email, password } = req.body;

      const userWithoutPassword = await this.authService.login(email, password);

      const expectedClient =
        userWithoutPassword.role === "ADMIN" ||
        userWithoutPassword.role === "SUPER_ADMIN"
          ? "ADMIN"
          : "MOBILE";

      if (clientSource !== expectedClient) {
        return res
          .status(403)
          .json(
            new ApiResponse(
              403,
              null,
              `Forbidden: Channel mismatch for role [${userWithoutPassword.role}]`,
            ),
          );
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

      const { accessToken } = await this.sessionService.signTo(
        res,
        sessionPayload,
        clientSource,
      );

      const result = { accessToken, user: userWithoutPassword };

      return res
        .status(200)
        .json(new ApiResponse(200, result, "User logged in successfully"));
    });
  }

  // Define route handlers as instance properties bound to the class context
  readonly register = asyncHandler(async (req: Request, res: Response) => {
    const response = await this.authService.registerUser(req.body);
    return res
      .status(201)
      .json(new ApiResponse(201, response, "User registered successfully"));
  });

  readonly loginMobile = this.handleLoginPipeline("MOBILE");

  readonly loginAdmin = this.handleLoginPipeline("ADMIN");

  readonly refreshSession = asyncHandler(
    async (req: Request, res: Response) => {
      const { accessToken, refreshToken } =
        await this.sessionService.refreshSession(req, res);
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { accessToken, refreshToken },
            "Session refreshed successfully",
          ),
        );
    },
  );

  readonly logout = asyncHandler(async (req: Request, res: Response) => {
    await this.authService.logout(res, req);
    return res
      .status(200)
      .json(new ApiResponse(200, null, "User logged out successfully"));
  });

  readonly getAuthenticatedUser = asyncHandler(
    async (req: Request, res: Response) => {
      const userWithoutPassword =
        await this.authService.getAuthenticatedUser(req);
      return res
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

  readonly forgetPassword = asyncHandler(
    async (req: Request, res: Response) => {
      const { email } = req.body;
      await this.authService.forgetPassword(email);
      return res
        .status(202)
        .json(
          new ApiResponse(
            202,
            null,
            "Password reset instructions sent successfully",
          ),
        );
    },
  );

  readonly verifyOtp = asyncHandler(async (req: Request, res: Response) => {
    const { otp, purpose, email } = req.body;

    if (!otp || typeof otp !== "string") {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "OTP is required for verification"));
    }

    // FIXED: Correctly capture output payload structure and mapping
    const verificationResult = await this.authService.verifyOtp(
      email,
      otp,
      purpose,
    );

    return res
      .status(202)
      .json(
        new ApiResponse(202, verificationResult, "OTP verified successfully"),
      );
  });

  readonly resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;
    await this.authService.resetPassword(token, newPassword);
    return res
      .status(202)
      .json(new ApiResponse(202, null, "Password reset successfully"));
  });
}
