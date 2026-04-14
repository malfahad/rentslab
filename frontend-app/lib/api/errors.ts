import { formatApiErrorBody } from "@/lib/api/parse-error";

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, body: unknown) {
    super(`HTTP ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }

  get messageForUser(): string {
    return formatApiErrorBody(this.body);
  }
}
