"use client"

import { useEffect, useState } from "react"
import { History, Search, Clock, ChevronRight, Terminal, RefreshCw, Trash2, Loader2, Pin } from "lucide-react"
import { apiUrl } from "../../lib/api"

type Workspace = {
  id: number;
  user_query: string;
  generated_sql: string;
  insight_narrative: string | null;
  created_at: string;
  is_pinned: boolean;
}

export default function SavedWorkspaces() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pinningId, setPinningId] = useState<number | null>(null);
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

  const handlePin = async (e: React.MouseEvent, id: number, currentStatus: boolean) => {
    e.stopPropagation();
    setPinningId(id);
    try {
      const res = await fetch(apiUrl(`/api/v1/workspaces/${id}/pin`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_pinned: !currentStatus })
      });
      if (res.ok) {
        setWorkspaces(prev => prev.map(w => w.id === id ? { ...w, is_pinned: !currentStatus } : w));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPinningId(null);
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

        <div className="relative group">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
            <Search className="w-5 h-5" />
          </div>
          <input 
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search saved queries..."
            className="w-full pl-12 pr-4 py-3 bg-black/20 backdrop-blur-md border border-white/10 rounded-xl shadow-inner focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all text-foreground placeholder:text-muted-foreground/70"
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
              filtered.map((w, index) => (
                <div key={w.id} className="p-6 rounded-2xl border border-white/5 bg-black/20 backdrop-blur-md hover:border-primary/30 shadow-lg hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer group animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${index * 50}ms` }}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-1.5">
                      <h3 className="font-semibold text-lg group-hover:text-primary transition-colors text-foreground/90">"{w.user_query}"</h3>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
                         <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {new Date(w.created_at).toLocaleDateString()}</span>
                         <span className="flex items-center gap-1.5 uppercase tracking-wider text-green-400/80"><Terminal className="w-3.5 h-3.5" /> SQL Validated</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => handlePin(e, w.id, w.is_pinned)}
                        disabled={pinningId === w.id}
                        className={`p-2.5 rounded-lg transition-all duration-200 disabled:opacity-50 ${w.is_pinned ? 'bg-primary/20 text-primary shadow-[0_0_15px_rgba(56,189,248,0.2)]' : 'bg-white/5 hover:bg-primary/10 text-muted-foreground hover:text-primary'}`}
                        title={w.is_pinned ? "Unpin from Dashboard" : "Pin to Dashboard"}
                      >
                        {pinningId === w.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pin className={`w-4 h-4 ${w.is_pinned ? 'fill-primary' : ''}`} />}
                      </button>
                      <button 
                        onClick={(e) => handleDelete(e, w.id)}
                        disabled={deletingId === w.id}
                        className="p-2.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-all duration-200 disabled:opacity-50"
                        title="Delete Workspace"
                      >
                        {deletingId === w.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                      <ChevronRight className="w-5 h-5 ml-2 text-muted-foreground opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                    </div>
                  </div>
                  
                  {w.insight_narrative && (
                    <div className="mb-5 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 text-sm text-blue-100/90 italic shadow-inner">
                       "{w.insight_narrative.length > 150 ? w.insight_narrative.substring(0, 150) + '...' : w.insight_narrative}"
                    </div>
                  )}

                  <div className="p-4 bg-zinc-950/80 rounded-xl border border-white/5 text-xs font-mono text-zinc-300 overflow-hidden text-ellipsis whitespace-nowrap shadow-inner">
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
