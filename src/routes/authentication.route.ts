import express from "express";
import { register } from "../model/Authentication/Auth.controller.js";
import { createUserSchema } from "../validation/authentication.validation.js";
import { validate } from "../middleware/validation.js";

const authenticationRouter = express.Router();

authenticationRouter.post("/register", validate(createUserSchema), register);

export default authenticationRouter;
