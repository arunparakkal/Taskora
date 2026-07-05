import type { AppRole } from "@/types/database";

export const ROLE_COOKIE_NAME = "taskora_role";

const VALID_ROLES: AppRole[] = ["admin", "team_lead", "member"];

export function isAppRole(value: string | undefined | null): value is AppRole {
  return VALID_ROLES.includes(value as AppRole);
}

export function readRoleFromAuthUser(user: {
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
}): AppRole | undefined {
  const fromApp = user.app_metadata?.role;
  const fromUser = user.user_metadata?.role;
  const candidate =
    typeof fromApp === "string"
      ? fromApp
      : typeof fromUser === "string"
        ? fromUser
        : undefined;
  return isAppRole(candidate) ? candidate : undefined;
}

export const ROLE_COOKIE_OPTIONS = {
  httpOnly: true,
  path: "/",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 7,
};
