import { useCallback, useEffect, useRef, useState } from "react";

export type NotifPermission = "default" | "granted" | "denied" | "unsupported";

function playOrderChime() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

    const playNote = (freq: number, startTime: number, duration: number, gainPeak: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(gainPeak, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const t = ctx.currentTime;
    playNote(880, t,       0.35, 0.35);
    playNote(1108, t + 0.18, 0.35, 0.30);
    playNote(1320, t + 0.36, 0.50, 0.25);

    setTimeout(() => ctx.close(), 1500);
  } catch {
    // AudioContext not supported — silent fail
  }
}

function showBrowserNotif(orderId: number, customerName: string, total: number, itemCount: number) {
  if (Notification.permission !== "granted") return;
  try {
    const n = new Notification(`New Order #${orderId} — Terra`, {
      body: `${customerName} · ${itemCount} item${itemCount !== 1 ? "s" : ""} · Rs ${total.toFixed(0)}`,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: `order-${orderId}`,
      requireInteraction: false,
    });
    setTimeout(() => n.close(), 8000);
  } catch {
    // Notification API not available
  }
}

export function useOrderNotifications() {
  const [permission, setPermission] = useState<NotifPermission>(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
    return Notification.permission as NotifPermission;
  });
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try { return localStorage.getItem("admin-sound-enabled") !== "false"; } catch { return true; }
  });
  const [notifEnabled, setNotifEnabled] = useState(() => {
    try { return localStorage.getItem("admin-notif-enabled") !== "false"; } catch { return true; }
  });

  const toggleSound = useCallback(() => {
    setSoundEnabled((v) => {
      const next = !v;
      try { localStorage.setItem("admin-sound-enabled", String(next)); } catch {}
      return next;
    });
  }, []);

  const toggleNotif = useCallback(() => {
    setNotifEnabled((v) => {
      const next = !v;
      try { localStorage.setItem("admin-notif-enabled", String(next)); } catch {}
      return next;
    });
  }, []);

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) { setPermission("unsupported"); return; }
    try {
      const result = await Notification.requestPermission();
      setPermission(result as NotifPermission);
    } catch {
      setPermission("denied");
    }
  }, []);

  const notify = useCallback((orderId: number, customerName: string, total: number, itemCount: number) => {
    if (soundEnabled) playOrderChime();
    if (notifEnabled && permission === "granted") {
      showBrowserNotif(orderId, customerName, total, itemCount);
    }
  }, [soundEnabled, notifEnabled, permission]);

  // Re-sync permission if changed externally
  useEffect(() => {
    if (!("Notification" in window)) return;
    const interval = setInterval(() => {
      setPermission(Notification.permission as NotifPermission);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return {
    permission,
    soundEnabled,
    notifEnabled,
    toggleSound,
    toggleNotif,
    requestPermission,
    notify,
  };
}

export type { ReturnType };
