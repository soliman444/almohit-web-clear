import { ApiClientError, ApiUnavailableError } from "./errors";

export type SafeApiResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      reason: "API_UNAVAILABLE";
    };

export type SafeWarehouseResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      reason: "API_UNAVAILABLE" | "WAREHOUSE_ASSIGNMENT_REQUIRED";
    };

export async function safeApiCall<T>(
  action: () => Promise<T>,
): Promise<SafeApiResult<T>> {
  try {
    return {
      ok: true,
      data: await action(),
    };
  } catch (error) {
    if (
      error instanceof ApiUnavailableError
      || (error instanceof ApiClientError && error.status >= 500)
    ) {
      return {
        ok: false,
        reason: "API_UNAVAILABLE",
      };
    }

    throw error;
  }
}

export function isWarehouseAssignmentError(error: unknown): boolean {
  return error instanceof ApiClientError && error.code === "WAREHOUSE_ASSIGNMENT_REQUIRED";
}

export async function safeWarehouseCall<T>(
  action: () => Promise<T>,
): Promise<SafeWarehouseResult<T>> {
  try {
    return {
      ok: true,
      data: await action(),
    };
  } catch (error) {
    if (isWarehouseAssignmentError(error)) {
      return {
        ok: false,
        reason: "WAREHOUSE_ASSIGNMENT_REQUIRED",
      };
    }
    if (
      error instanceof ApiUnavailableError
      || (error instanceof ApiClientError && error.status >= 500)
    ) {
      return {
        ok: false,
        reason: "API_UNAVAILABLE",
      };
    }
    throw error;
  }
}