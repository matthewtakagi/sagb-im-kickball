import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { redirect } from "next/navigation";

const COOKIE = "sagb_admin";

function secret() {
  return process.env.ADMIN_PIN || (process.env.NODE_ENV === "production" ? "" : "sagb");
}

function token() {
  const pin = secret();
  if (!pin) return "";
  return createHmac("sha256", pin).update("sagb-im-kickball-admin").digest("hex");
}

export async function isAdmin() {
  await connection();
  const pin = secret();
  if (!pin) return false;
  const jar = await cookies();
  const value = jar.get(COOKIE)?.value;
  if (!value) return false;
  const expected = token();
  const a = Buffer.from(value);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function loginAdmin(pin: string) {
  const expected = secret();
  if (!expected) {
    return { ok: false as const, error: "Set ADMIN_PIN in your environment." };
  }
  const a = Buffer.from(pin);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false as const, error: "Wrong PIN." };
  }
  const jar = await cookies();
  jar.set(COOKIE, token(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return { ok: true as const };
}

export async function logoutAdmin() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function requireAdmin() {
  if (!(await isAdmin())) {
    redirect("/admin/login");
  }
}

export function adminPinConfigured() {
  return Boolean(secret());
}
