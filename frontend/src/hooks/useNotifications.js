// src/hooks/useNotifications.js
// Shared helpers for the client notifications tab and its unread badge.
import { useCallback, useEffect, useState } from 'react';
import { listNotifications } from '../services/api';

/** API may return a plain array or { notifications: [...] }. */
export function toNotificationList(res) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.notifications)) return res.notifications;
  return [];
}

/** Backend statuses: pending | sent | failed | read. Anything not "read" is new. */
export function isUnread(notification) {
  return notification?.status !== 'read';
}

/**
 * Best-effort unread counter for the tab label.
 * Loads on mount, then polls every `intervalMs` (default 60 s).
 * Failures are ignored on purpose: a badge must never break the dashboard.
 */
export function useUnreadCount(intervalMs = 60000) {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const list = toNotificationList(await listNotifications());
      setCount(list.filter(isUnread).length);
    } catch {
      // keep the previous count
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, intervalMs);
    return () => window.clearInterval(timer);
  }, [refresh, intervalMs]);

  return { count, refresh };
}