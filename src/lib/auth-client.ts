import { createAuthClient } from "better-auth/react";

/** Browser side of the login. Talks to /api/auth on this same site. */
export const authClient = createAuthClient();
