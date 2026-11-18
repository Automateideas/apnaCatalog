import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/better-auth";

// Google login, callback and sign-out (Better Auth).
export const { GET, POST } = toNextJsHandler(auth);
