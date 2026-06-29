class ApiResponse {
  public statusCode: number;
  public data: any;
  public message: string;
  public success: boolean;
  public meta: any;

  constructor(
    statusCode: number,
    data: any,
    message: string = "Success",
    meta?: any,
  ) {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
    this.meta = meta;
  }
}

export { ApiResponse };
