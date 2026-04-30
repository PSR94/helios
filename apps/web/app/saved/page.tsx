"use client"

import { useEffect, useState } from "react"
import { History, Search, Clock, ChevronRight, Terminal, RefreshCw, Trash2, Loader2 } from "lucide-react"
import { apiUrl } from "../../lib/api"

type Workspace = {
  id: number;
  user_query: string;
  generated_sql: string;
  insight_narrative: string | null;
  created_at: string;
}

export default function SavedWorkspaces() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const fetchWorkspaces = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/v1/workspaces/"));
      const data = await res.json();
      setWorkspaces(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); // prevent clicking the card
    setDeletingId(id);
    try {
      await fetch(apiUrl(`/api/v1/workspaces/${id}`), { method: "DELETE" });
      setWorkspaces(prev => prev.filter(w => w.id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const filtered = workspaces.filter(w => 
    w.user_query.toLowerCase().includes(search.toLowerCase()) || 
    w.generated_sql.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-background overflow-y-auto">
      <div className="p-8 max-w-5xl mx-auto w-full space-y-8">
        <div className="flex items-center justify-between border-b pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <History className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Saved Workspaces</h1>
              <p className="text-muted-foreground mt-1">Revisit your previously generated insights and SQL queries.</p>
            </div>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search saved queries..."
            className="w-full pl-10 pr-4 py-2 bg-muted/30 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {loading ? (
          <div className="py-20 flex items-center justify-center text-muted-foreground">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Loading history...
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground border-2 border-dashed rounded-xl">
                 No saved workspaces found.
              </div>
            ) : (
              filtered.map((w) => (
                <div key={w.id} className="p-6 rounded-xl border bg-card hover:border-primary/50 transition-all cursor-pointer group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">"{w.user_query}"</h3>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                         <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(w.created_at).toLocaleDateString()}</span>
                         <span className="flex items-center gap-1 uppercase tracking-wider"><Terminal className="w-3 h-3" /> SQL Validated</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={(e) => handleDelete(e, w.id)}
                        disabled={deletingId === w.id}
                        className="p-2 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-50"
                      >
                        {deletingId === w.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                      <ChevronRight className="w-5 h-5 opacity-20 group-hover:opacity-100 transition-all" />
                    </div>
                  </div>
                  
                  {w.insight_narrative && (
                    <div className="mb-4 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10 text-sm text-blue-200/80 italic">
                       "{w.insight_narrative.length > 150 ? w.insight_narrative.substring(0, 150) + '...' : w.insight_narrative}"
                    </div>
                  )}

                  <div className="p-3 bg-zinc-950 rounded border border-zinc-800 text-[12px] font-mono text-zinc-400 overflow-hidden text-ellipsis whitespace-nowrap">
                    {w.generated_sql}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
