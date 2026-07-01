import { AuthRepository } from "../Auth.repo.js";
import bcrypt from "bcrypt";
import { Response, Request } from "express";
import { SessionService } from "../../../utils/Session.js";
jest.mock("../Auth.repo.js", () => ({
  AuthRepository: {
    findUserByEmail: jest.fn(),
    createUserAccount: jest.fn(),
  },
}));
jest.mock("../../../utils/Session.js", () => ({
  SessionService: {
    signTo: jest.fn(),
    clearFrom: jest.fn(),
  },
}));

jest.mock("bcrypt", () => {
  return {
    hash: jest.fn(),
    compare: jest.fn(),
  };
});

export const mockedFindUserByEmail = jest.mocked(
  AuthRepository.findUserByEmail,
);
export const mockedCreateUserAccount = jest.mocked(
  AuthRepository.createUserAccount,
);
export const mockedHash = jest.mocked(bcrypt.hash);
export const mockedCompare = jest.mocked(bcrypt.compare);
export const mockedSignTo = jest.mocked(SessionService.signTo);
export const mockedClearFrom = jest.mocked(SessionService.clearFrom);
export const createMockExpressContext = () => {
  const req = {} as Partial<Request>;

  // Explicitly structure the response mock to support method chaining out of the box
  const res = {} as Partial<Response>;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);

  const next = jest.fn();

  return {
    req: req as Request,
    res: res as Response,
    next,
  };
};
