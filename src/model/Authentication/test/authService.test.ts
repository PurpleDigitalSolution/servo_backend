import {
  createMockExpressContext,
  mockedCompare,
  mockedCreateUserAccount,
  mockedFindUserByEmail,
  mockedHash,
} from "./mocks.js";

import { CreateUserDTO } from "../../../interface/user.interface.js";
import { AuthenticationService } from "../Auth.service.js";
import { ApiError } from "../../../utils/errorHandler.js";
import { SessionService } from "../../../utils/Session.js";
const createdAt = new Date();

const mockUser: CreateUserDTO = {
  firstName: "John",
  lastName: "Doe",
  email: "email@example.com",
  password: "password123",
  role: "USER",
  phoneNumber: "1234567890",
  dateOfBirth: new Date("1990-01-01"),
  address: "123 Main St",
};
const createdUser = {
  id: "user-1",
  email: mockUser.email,
  role: mockUser.role,
  accountStatus: "ACTIVE",
  userProfile: {
    firstName: mockUser.firstName,
    lastName: mockUser.lastName,
    phoneNumber: mockUser.phoneNumber,
    dateOfBirth: mockUser.dateOfBirth,
    address: mockUser.address,
  } as never,
  createdAt,
};
describe("AuthenticationService.registerUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should register a new user successfully", async () => {
    mockedFindUserByEmail.mockResolvedValueOnce(null);

    mockedHash.mockResolvedValueOnce("hashedPassword" as never);

    mockedCreateUserAccount.mockResolvedValue(createdUser as never);

    const result = await AuthenticationService.registerUser(mockUser);

    expect(mockedFindUserByEmail).toHaveBeenCalledTimes(1);
    expect(mockedFindUserByEmail).toHaveBeenCalledWith(mockUser.email);

    expect(mockedHash).toHaveBeenCalledTimes(1);
    expect(mockedHash).toHaveBeenCalledWith(mockUser.password, 10);

    expect(mockedCreateUserAccount).toHaveBeenCalledTimes(1);
    expect(mockedCreateUserAccount).toHaveBeenCalledWith({
      ...mockUser,
      password: "hashedPassword",
    });

    expect(result).toBe(createdUser);
  });

  it("should throw an ApiError if a user with the email already exists", async () => {
    mockedFindUserByEmail.mockResolvedValue({
      id: "1",
      ...mockUser,
    } as any);

    await expect(AuthenticationService.registerUser(mockUser)).rejects.toThrow(
      ApiError,
    );

    expect(mockedHash).not.toHaveBeenCalled();
    expect(mockedCreateUserAccount).not.toHaveBeenCalled();
  });

  it("should propagate hashing errors", async () => {
    mockedFindUserByEmail.mockResolvedValue(null);

    mockedHash.mockRejectedValueOnce(new Error("Hashing failed") as never);

    await expect(AuthenticationService.registerUser(mockUser)).rejects.toThrow(
      "Hashing failed",
    );

    expect(mockedCreateUserAccount).not.toHaveBeenCalled();
  });

  it("should propagate repository errors when creating the user", async () => {
    mockedFindUserByEmail.mockResolvedValue(null);

    mockedHash.mockResolvedValueOnce("hashedPassword" as never);

    mockedCreateUserAccount.mockRejectedValueOnce(new Error("Database error"));

    await expect(AuthenticationService.registerUser(mockUser)).rejects.toThrow(
      "Database error",
    );
  });
});

describe("AuthenticationService.login", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  const mockedFindUserData = {
    ...createdUser,
    passwordHash: "hashedPassword",
  };
  it("should login user successfully with correct credentials", async () => {
    mockedFindUserByEmail.mockResolvedValue(mockedFindUserData as never);

    mockedCompare.mockResolvedValue(true as never);

    const result = await AuthenticationService.login(
      mockUser.email,
      mockUser.password,
    );

    expect(mockedFindUserByEmail).toHaveBeenCalledWith(mockUser.email);

    expect(mockedCompare).toHaveBeenCalledWith(
      mockUser.password,
      mockedFindUserData.passwordHash,
    );

    expect(result).toEqual(createdUser);
  });
  it("should throw api error when user not found", async () => {
    mockedFindUserByEmail.mockResolvedValue(null as never);
    await expect(
      AuthenticationService.login(mockUser.email, mockUser.password),
    ).rejects.toThrow(ApiError);

    expect(mockedCompare).not.toHaveBeenCalled();
  });
  it("should throw api error when the password is incorrect", async () => {
    mockedFindUserByEmail.mockResolvedValue(mockedFindUserData as never);
    mockedCompare.mockResolvedValue(false as never);

    await expect(
      AuthenticationService.login(mockUser.email, mockUser.password),
    ).rejects.toThrow(ApiError);

    expect(mockedCompare).toHaveBeenCalledTimes(1);
  });
});
describe("AuthenticationService.logout", () => {
  it("should throw an ApiError if there is no active session", async () => {
    const mockRes = {} as any;
    const mockReq = { user: null } as any;

    await expect(
      AuthenticationService.logout(mockRes, mockReq),
    ).rejects.toThrow(ApiError);
  });

  it("should throw an ApiError if sessionId is missing", async () => {
    const mockRes = {} as any;
    const mockReq = { user: { userId: "user-1" } } as any;

    await expect(
      AuthenticationService.logout(mockRes, mockReq),
    ).rejects.toThrow(ApiError);
  });
  it("should call SessionService.clearFrom with correct parameters", async () => {
    const mockReq = {
      user: { userId: "user-1", sessionId: "session-1" },
    } as any;
    const { res } = createMockExpressContext();

    await AuthenticationService.logout(res, mockReq);
    expect(SessionService.clearFrom).toHaveBeenCalledWith(
      res,
      "user-1",
      "session-1",
    );
  });
});
