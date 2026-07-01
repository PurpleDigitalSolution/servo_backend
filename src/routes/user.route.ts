import express from "express";
import {
  getUsers,
  getProfile,
  updateProfile,
  searchUser,
  getUserById,
} from "../model/user/user.controller.js";
import { validate } from "../middleware/validation.js";
import {
  findUserRequestSchema,
  getUsersRequestSchema,
  searchRequestSchema,
  updateProfileRequestSchema,
} from "../validation/user.validation.js";

const userRoute = express.Router();
userRoute.get("/", validate(getUsersRequestSchema), getUsers);
userRoute.get("/search", validate(searchRequestSchema), searchUser);
userRoute.get("/profile", getProfile);
userRoute.put("/profile", validate(updateProfileRequestSchema), updateProfile);
userRoute.get("/user-profile", validate(findUserRequestSchema), getUserById);
export default userRoute;
