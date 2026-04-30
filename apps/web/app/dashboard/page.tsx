"use client"

import { useEffect, useState } from "react"
import { LayoutDashboard, Loader2, RefreshCw } from "lucide-react"
import { apiUrl } from "../../lib/api"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type Workspace = {
  id: number;
  user_query: string;
  generated_sql: string;
  insight_narrative: string | null;
  created_at: string;
  is_pinned: boolean;
  results_json: string | null;
}

export default function ExecutiveDashboard() {
  const [pinnedWorkspaces, setPinnedWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkspaces = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/v1/workspaces/"));
      const data: Workspace[] = await res.json();
      setPinnedWorkspaces(data.filter(w => w.is_pinned));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const renderChart = (workspace: Workspace) => {
    if (!workspace.results_json) return <div className="text-muted-foreground text-sm flex items-center justify-center h-full">No chart data available.</div>;
    
    try {
      const runResult = JSON.parse(workspace.results_json);
      if (!runResult || !runResult.columns || runResult.columns.length < 2) {
        return <div className="text-muted-foreground text-sm flex items-center justify-center h-full">Insufficient data for charting.</div>;
      }
      
      const chartData = runResult.rows.map((row: any[]) => {
        const obj: any = {};
        runResult.columns.forEach((col: string, i: number) => {
          obj[col] = row[i];
        });
        return obj;
      });

      const isTimeScale = runResult.columns[0].toLowerCase().includes('date') || runResult.columns[0].toLowerCase().includes('day');

      return (
        <ResponsiveContainer width="100%" height="100%">
          {isTimeScale ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey={runResult.columns[0]} stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', fontSize: '12px' }} />
              <Line type="monotone" dataKey={runResult.columns[1]} stroke="#38bdf8" strokeWidth={2} dot={false} />
            </LineChart>
          ) : (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey={runResult.columns[0]} stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', fontSize: '12px' }} />
              <Bar dataKey={runResult.columns[1]} fill="#38bdf8" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      );
    } catch (e) {
      return <div className="text-red-500 text-sm flex items-center justify-center h-full">Error parsing chart data.</div>;
    }
  }

  return (
    <div className="h-full flex flex-col bg-background overflow-y-auto">
      <div className="p-8 mx-auto w-full max-w-7xl space-y-8">
        <div className="flex items-center justify-between border-b border-white/10 pb-6 relative">
          <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 bg-primary/20 border border-primary/30 rounded-xl shadow-[0_0_15px_rgba(56,189,248,0.2)]">
              <LayoutDashboard className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Executive Dashboard</h1>
              <p className="text-muted-foreground mt-1 font-medium">Your pinned metrics and high-level KPIs.</p>
            </div>
          </div>
          <button 
            onClick={fetchWorkspaces}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 text-foreground font-medium rounded-xl hover:bg-white/10 hover:shadow-lg transition-all relative z-10"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="py-32 flex items-center justify-center text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mr-3 text-primary" /> Loading dashboard...
          </div>
        ) : pinnedWorkspaces.length === 0 ? (
          <div className="py-32 text-center text-muted-foreground border-2 border-dashed border-border/50 rounded-2xl bg-muted/5">
             <LayoutDashboard className="w-12 h-12 mx-auto mb-4 opacity-20" />
             <h3 className="text-lg font-medium text-foreground">No Pinned Charts</h3>
             <p className="mt-2">Pin queries from your Saved Workspaces to build your dashboard.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {pinnedWorkspaces.map((w, index) => (
              <div key={w.id} className="rounded-2xl border border-white/10 bg-black/20 backdrop-blur-md shadow-xl flex flex-col h-[450px] group hover:border-primary/30 hover:shadow-[0_0_30px_rgba(56,189,248,0.1)] transition-all duration-500 animate-in fade-in slide-in-from-bottom-8" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="px-6 py-5 border-b border-white/5 bg-white/5 rounded-t-2xl">
                  <h3 className="font-bold text-lg line-clamp-1 text-foreground/90 group-hover:text-primary transition-colors" title={w.user_query}>{w.user_query}</h3>
                  {w.insight_narrative && (
                    <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2 italic font-medium">
                      "{w.insight_narrative}"
                    </p>
                  )}
                </div>
                <div className="flex-1 p-6 min-h-0 bg-gradient-to-b from-transparent to-black/10">
                   {renderChart(w)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
