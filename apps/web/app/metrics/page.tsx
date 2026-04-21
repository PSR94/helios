"use client"

import { useEffect, useState } from "react"
import { BookOpen, AlertCircle, RefreshCw, Hash, Database, Filter } from "lucide-react"
import { apiUrl } from "../../lib/api"

type Metric = {
  name: string;
  description: string;
  type: string;
  sql: string;
  filters?: string[];
}

export default function MetricCatalog() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch(apiUrl("/api/v1/metrics"));
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch metrics");
        setMetrics(data.metrics);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  return (
    <div className="h-full flex flex-col bg-background overflow-y-auto">
      <div className="p-8 max-w-6xl mx-auto w-full space-y-8">
        <div className="flex items-center gap-3 border-b pb-6">
          <div className="p-3 bg-primary/10 rounded-lg">
            <BookOpen className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Metric Catalog</h1>
            <p className="text-muted-foreground mt-1">Governed business definitions and their underlying SQL logic.</p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Loading semantic layer...
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {metrics.map((metric) => (
              <div key={metric.name} className="rounded-xl border bg-card shadow-sm overflow-hidden flex flex-col hover:border-primary/50 transition-colors">
                <div className="p-5 border-b bg-muted/20">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Hash className="w-4 h-4 text-primary" /> {metric.name}
                    </h3>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-secondary text-secondary-foreground uppercase tracking-wider">
                      {metric.type}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{metric.description}</p>
                </div>
                
                <div className="p-5 space-y-4 flex-1 bg-zinc-950/50">
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5" /> Calculation SQL
                    </div>
                    <code className="block p-3 rounded-md bg-zinc-950 border border-zinc-800 text-sm text-zinc-300 font-mono">
                      {metric.sql}
                    </code>
                  </div>

                  {metric.filters && metric.filters.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                        <Filter className="w-3.5 h-3.5" /> Required Filters
                      </div>
                      <div className="space-y-1.5">
                        {metric.filters.map((f, i) => (
                          <div key={i} className="px-3 py-1.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-mono">
                            {f}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
