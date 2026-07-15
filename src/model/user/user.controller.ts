import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/async.js";
import { UserRepository } from "./user.repository.js";
import { UserService } from "./user.service.js";
import { Request, Response } from "express";
const userService = new UserService(new UserRepository());
export const getCustomer = asyncHandler(async (req: Request, res: Response) => {
  const { limit, page } = req.query as { limit?: string; page?: string };
  const result = await userService.getCustomer(limit || "50", page || "1");
  res
    .status(200)
    .json(new ApiResponse(200, result, "Customers fetched successfully"));
});
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const profile = await userService.getProfile(userId);
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
    const profile = await userService.updateProfile(userId, req.body);
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
  const result = await userService.searchUsers(
    query,
    limit || "50",
    page || "1",
  );
  res
    .status(200)
    .json(new ApiResponse(200, result, "Users fetched successfully"));
});
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = await userService.getProfile(id as string);
  res.status(200).json(new ApiResponse(200, user, "User fetched successfully"));
});
