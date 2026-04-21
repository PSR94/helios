"use client";

import { useEffect, useState } from "react";

import { apiUrl } from "../lib/api";

type HealthResponse = {
  status: "ok" | "degraded";
  environment: string;
};

export function SystemHealthBadge() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadHealth() {
      try {
        const response = await fetch(apiUrl("/api/v1/health"), { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Health check failed");
        }

        const data: HealthResponse = await response.json();
        if (!cancelled) {
          setHealth(data);
          setError(false);
        }
      } catch {
        if (!cancelled) {
          setError(true);
        }
      }
    }

    loadHealth();
    const intervalId = window.setInterval(loadHealth, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  if (error) {
    return (
      <span className="text-sm px-2 py-1 bg-red-500/10 text-red-500 rounded border border-red-500/20">
        System Unreachable
      </span>
    );
  }

  if (!health) {
    return (
      <span className="text-sm px-2 py-1 bg-muted text-muted-foreground rounded border">
        Checking Health
      </span>
    );
  }

  const isHealthy = health.status === "ok";
  return (
    <span
      className={`text-sm px-2 py-1 rounded border ${
        isHealthy
          ? "bg-green-500/10 text-green-500 border-green-500/20"
          : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      }`}
      title={`Environment: ${health.environment}`}
    >
      {isHealthy ? "System Healthy" : "System Degraded"}
    </span>
  );
}
