"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { safeCallbackPath } from "@/lib/auth-guard";

export type LoginState = { message: string; email: string } | undefined;

const INVALID = "Email hoặc mật khẩu không đúng";

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = formData.get("email");
  const password = formData.get("password");
  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return { message: INVALID, email: typeof email === "string" ? email : "" };
  }
  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: safeCallbackPath(formData.get("callbackUrl")),
    });
  } catch (error) {
    // Wrong email, wrong password and non-admin accounts all get the same message.
    if (error instanceof AuthError) return { message: INVALID, email };
    throw error; // signIn() redirects by throwing.
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
