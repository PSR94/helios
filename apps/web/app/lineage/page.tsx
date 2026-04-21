"use client"

import { useEffect, useState } from "react"
import { GitGraph, Database, Hash, ArrowRight, Layers, RefreshCw, Info } from "lucide-react"
import { apiUrl } from "../../lib/api"

type Node = {
  id: string;
  type: 'table' | 'metric';
  label: string;
}

type Link = {
  source: string;
  target: string;
}

export default function SemanticLineage() {
  const [data, setData] = useState<{ nodes: Node[], links: Link[] }>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLineage = async () => {
      try {
        const res = await fetch(apiUrl("/api/v1/lineage/"));
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLineage();
  }, []);

  const metrics = data.nodes.filter(n => n.type === 'metric');
  const tables = data.nodes.filter(n => n.type === 'table');

  return (
    <div className="h-full flex flex-col bg-background overflow-y-auto">
      <div className="p-8 max-w-6xl mx-auto w-full space-y-8">
        <div className="flex items-center gap-3 border-b pb-6">
          <div className="p-3 bg-primary/10 rounded-lg">
            <GitGraph className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Semantic Lineage</h1>
            <p className="text-muted-foreground mt-1">Visualize the flow of logic from raw physical tables to governed business metrics.</p>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex items-center justify-center text-muted-foreground">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Resolving dependencies...
          </div>
        ) : (
          <div className="grid gap-12 relative">
             <div className="grid grid-cols-2 gap-24 relative">
                
                {/* Metrics Column */}
                <div className="space-y-6">
                   <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                     <Hash className="w-4 h-4" /> Governed Metrics
                   </h3>
                   <div className="space-y-4">
                     {metrics.map(m => (
                       <div key={m.id} className="p-4 rounded-xl border bg-card/50 border-primary/20 hover:border-primary/50 transition-all flex items-center justify-between group">
                          <span className="font-medium">{m.label}</span>
                          <ArrowRight className="w-4 h-4 text-primary opacity-20 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0" />
                       </div>
                     ))}
                   </div>
                </div>

                {/* Tables Column */}
                <div className="space-y-6">
                   <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                     <Database className="w-4 h-4" /> Source Tables
                   </h3>
                   <div className="space-y-4">
                     {tables.map(t => (
                       <div key={t.id} className="p-4 rounded-xl border bg-card/30 hover:border-muted-foreground/30 transition-all flex items-center gap-3">
                          <div className="p-2 bg-muted rounded-lg">
                             <Database className="w-4 h-4 opacity-50" />
                          </div>
                          <span className="font-medium text-muted-foreground">{t.label}</span>
                       </div>
                     ))}
                   </div>
                </div>

             </div>

             <div className="p-6 rounded-xl bg-blue-500/5 border border-blue-500/10 flex gap-4">
                <Info className="w-5 h-5 text-blue-400 shrink-0" />
                <div className="text-sm text-blue-200/70 leading-relaxed">
                   HELIOS automatically resolves these relationships at plan-time to ensure that AI-generated SQL respects the join paths and filtering logic defined in your <code>metrics.yaml</code> semantic catalog.
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  )
}
