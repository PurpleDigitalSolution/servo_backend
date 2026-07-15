import express from "express";
import {
  getProfile,
  updateProfile,
  searchUser,
  getUserById,
  getCustomer,
} from "../model/user/user.controller.js";
import { validate } from "../middleware/validation.js";
import {
  findUserRequestSchema,
  getCustomerRequestSchema,
  searchRequestSchema,
  updateProfileRequestSchema,
} from "../validation/user.validation.js";

const userRoute = express.Router();
userRoute.get("/", validate(getCustomerRequestSchema), getCustomer);
userRoute.get("/search", validate(searchRequestSchema), searchUser);
userRoute.get("/profile", getProfile);
userRoute.put("/profile", validate(updateProfileRequestSchema), updateProfile);
userRoute.get(
  "/user-profile/:id",
  validate(findUserRequestSchema),
  getUserById,
);
export default userRoute;
