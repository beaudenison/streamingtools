export class TokenError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "TokenError";
  }
}

/** True when the platform rejected the refresh token, so only a new sign-in can fix it. */
export function needsSignIn(error: unknown) {
  return error instanceof TokenError && (error.status === 400 || error.status === 401);
}
