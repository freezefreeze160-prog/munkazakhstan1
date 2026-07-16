export class APIError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    public message: string,
  ) {
    super(message)
    this.name = "APIError"
  }

  toJSON() {
    return {
      error: this.code,
      message: this.message,
    }
  }
}

export const API_ERRORS = {
  UNAUTHORIZED: new APIError(401, "UNAUTHORIZED", "Authentication required"),
  FORBIDDEN: new APIError(403, "FORBIDDEN", "Insufficient permissions"),
  NOT_FOUND: new APIError(404, "NOT_FOUND", "Resource not found"),
  BAD_REQUEST: new APIError(400, "BAD_REQUEST", "Invalid request"),
  CONFLICT: new APIError(409, "CONFLICT", "Resource already exists"),
  SERVER_ERROR: new APIError(500, "SERVER_ERROR", "Internal server error"),
}
