import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import NetInfo from "@react-native-community/netinfo";

import { request } from "@/lib/api/core";
import { getWriteQueue, dequeueWrite } from "@/lib/cache";

interface NetworkContextType {
  isOnline: boolean;
  pendingWrites: number;
}

const NetworkContext = createContext<NetworkContextType>({
  isOnline: true,
  pendingWrites: 0,
});

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingWrites, setPendingWrites] = useState(0);
  const flushing = useRef(false);

  const flushQueue = useCallback(async () => {
    if (flushing.current) return;
    flushing.current = true;

    try {
      const queue = await getWriteQueue();
      setPendingWrites(queue.length);

      for (const write of queue) {
        try {
          await request(write.path, {
            method: write.method,
            ...(write.body ? { body: write.body } : {}),
          });
          await dequeueWrite(write.id);
          setPendingWrites((prev) => Math.max(0, prev - 1));
        } catch {
          // Stop flushing on first failure — still offline or server error
          break;
        }
      }
    } finally {
      flushing.current = false;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = state.isConnected !== false;
      setIsOnline(online);

      if (online) {
        void flushQueue();
      }
    });

    // Check pending writes on mount
    void getWriteQueue().then((q) => setPendingWrites(q.length));

    return unsubscribe;
  }, [flushQueue]);

  return (
    <NetworkContext.Provider value={{ isOnline, pendingWrites }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  return useContext(NetworkContext);
}
