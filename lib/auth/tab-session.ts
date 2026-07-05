/** Per-tab session binding (sessionStorage — isolated per browser tab). */
export const TAB_USER_KEY = "taskora:tab-user-id";
export const TAB_ID_KEY = "taskora:tab-id";
export const AUTH_BROADCAST_CHANNEL = "taskora-auth";

export type AuthBroadcastMessage = {
  type: "AUTH_CHANGED" | "SIGN_OUT";
  userId: string | null;
  tabId: string;
};

export function getTabId(): string {
  if (typeof window === "undefined") return "";
  let tabId = sessionStorage.getItem(TAB_ID_KEY);
  if (!tabId) {
    tabId = crypto.randomUUID();
    sessionStorage.setItem(TAB_ID_KEY, tabId);
  }
  return tabId;
}

export function bindTabToUser(userId: string) {
  sessionStorage.setItem(TAB_USER_KEY, userId);
}

export function getTabBoundUserId(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(TAB_USER_KEY);
}

export function clearTabBinding() {
  sessionStorage.removeItem(TAB_USER_KEY);
}

/** True when the shared JWT cookie user differs from this tab's bound user. */
export function isTabSessionMismatch(currentUserId: string | null): boolean {
  const bound = getTabBoundUserId();
  if (!bound) return false;
  if (!currentUserId) return true;
  return bound !== currentUserId;
}

export function broadcastAuthChange(userId: string | null, type: AuthBroadcastMessage["type"] = "AUTH_CHANGED") {
  if (typeof BroadcastChannel === "undefined") return;
  const channel = new BroadcastChannel(AUTH_BROADCAST_CHANNEL);
  channel.postMessage({
    type,
    userId,
    tabId: getTabId(),
  } satisfies AuthBroadcastMessage);
  channel.close();
}
