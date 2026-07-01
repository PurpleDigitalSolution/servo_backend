import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/async.js";
import { UserService } from "./user.service.js";
import { Request, Response } from "express";
export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const { limit, page } = req.query as { limit?: string; page?: string };
  const result = await UserService.getUsers(limit || "50", page || "1");
  res
    .status(200)
    .json(new ApiResponse(200, result, "Users fetched successfully"));
});
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const profile = await UserService.getProfile(userId);
  res
    .status(200)
    .json(new ApiResponse(200, profile, "Profile fetched successfully"));
});
export const updateProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const profile = await UserService.updateProfile(userId, req.body);
    res
      .status(200)
      .json(new ApiResponse(200, profile, "Profile updated successfully"));
  },
);
export const searchUser = asyncHandler(async (req: Request, res: Response) => {
  const { query, limit, page } = req.query as {
    query: string;
    limit?: string;
    page?: string;
  };
  const result = await UserService.searchUsers(
    query,
    limit || "50",
    page || "1",
  );
  res
    .status(200)
    .json(new ApiResponse(200, result, "Users fetched successfully"));
});
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.query.id;
  const user = await UserService.getProfile(userId as string);
  res.status(200).json(new ApiResponse(200, user, "User fetched successfully"));
});
