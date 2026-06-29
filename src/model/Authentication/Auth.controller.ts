import { Request, Response } from "express";
import { asyncHandler } from "../../utils/async.js";
import { AuthenticationService } from "./Auth.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const {
    email,
    password,
    role,
    firstName,
    lastName,
    phoneNumber,
    dateOfBirth,
    address,
  } = req.body;

  const response = await AuthenticationService.registerUser({
    email,
    password,
    role,
    firstName,
    lastName,
    phoneNumber,
    dateOfBirth,
    address,
  });
  res
    .status(201)
    .json(new ApiResponse(201, response, "User registered successfully"));
});
