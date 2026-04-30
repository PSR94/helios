"use client"

import { useState } from "react";
import { Sparkles, Terminal, Database, LineChart as LineChartIcon, Play, AlertCircle, CheckCircle2, ChevronRight, Loader2, Bookmark, Download } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { apiUrl } from "../lib/api";

export default function AnalyticsWorkspace() {
  const [query, setQuery] = useState("");
  
  // Plan State
  const [isPlanning, setIsPlanning] = useState(false);
  const [planResult, setPlanResult] = useState<{ sql: string, warnings: string[] } | null>(null);
  
  // Run State
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<{ columns: string[], rows: any[], time: number } | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    if (!planResult?.sql) return;
    setIsExporting(true);
    try {
      const res = await fetch(apiUrl("/api/v1/query/export"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql: planResult.sql }),
      });
      if (!res.ok) throw new Error("Export failed");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "helios_export.csv";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSave = async () => {
    if (!runResult || !planResult) return;
    setIsSaving(true);
    try {
      await fetch(apiUrl("/api/v1/workspaces/"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_query: query,
          generated_sql: planResult.sql,
          insight_narrative: insight,
          results_json: JSON.stringify(runResult)
        }),
      });
      setIsSaved(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    
    setIsPlanning(true);
    setError(null);
    setPlanResult(null);
    setRunResult(null);
    
    try {
      const res = await fetch(apiUrl("/api/v1/query/plan"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to generate plan");
      
      setPlanResult({
        sql: data.candidate_sql,
        warnings: data.validation_warnings
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsPlanning(false);
    }
  };

  const handleRunQuery = async () => {
    if (!planResult?.sql) return;
    
    setIsRunning(true);
    setError(null);
    setInsight(null);
    
    try {
      const res = await fetch(apiUrl("/api/v1/query/run"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql: planResult.sql }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Execution failed");
      
      setRunResult({
        columns: data.columns,
        rows: data.rows,
        time: data.execution_time_ms
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsRunning(false);
    }
  };

  const handleExplain = async () => {
    if (!runResult || !planResult) return;
    
    setIsExplaining(true);
    try {
      const res = await fetch(apiUrl("/api/v1/query/explain"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query,
          sql: planResult.sql,
          columns: runResult.columns,
          rows: runResult.rows
        }),
      });
      const data = await res.json();
      setInsight(data.insight);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsExplaining(false);
    }
  };

  // Helper to format rows to JSON objects for Recharts
  const formatDataForChart = () => {
    if (!runResult) return [];
    return runResult.rows.map(row => {
      const obj: any = {};
      runResult.columns.forEach((col, i) => {
        obj[col] = row[i];
      });
      return obj;
    });
  };

  const chartData = formatDataForChart();
  
  // Simple heuristic for chart type: if first column contains 'date' or 'day', use Line, else Bar
  const isTimeScale = runResult?.columns[0]?.toLowerCase().includes('date') || runResult?.columns[0]?.toLowerCase().includes('day');

  return (
    <div className="h-full flex flex-col">
      <div className="p-8 border-b border-white/5 bg-black/10 backdrop-blur-sm relative z-10">
        <div className="max-w-4xl mx-auto relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          <form onSubmit={handleGenerate} className="relative flex items-center bg-zinc-950/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-2">
            <div className="pl-4 pr-3 text-primary/80">
              <Sparkles className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 py-3 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-lg"
              placeholder="Ask a business question... (e.g. 'Show me daily active users for Pro tier this month')"
            />
            <div className="pr-2">
              <button
                type="submit"
                disabled={isPlanning || !query}
                className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0"
              >
                {isPlanning ? (
                  <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Planning</span>
                ) : (
                  <>Generate <ChevronRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </form>
          
          {error && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl flex items-center gap-3 text-sm backdrop-blur-md animate-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5" /> {error}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Context & SQL */}
        <div className="w-1/3 min-w-[400px] border-r border-white/5 flex flex-col bg-black/10 overflow-y-auto relative z-0">
          {planResult ? (
            <div className="p-6 space-y-6 animate-in fade-in slide-in-from-left-8 duration-500">
              
              <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md shadow-xl overflow-hidden group">
                <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                  <div className="flex items-center gap-3">
                    <Terminal className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-foreground/90">Generated SQL</h3>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs text-green-400 bg-green-400/10 px-2.5 py-1 rounded-md border border-green-400/20 shadow-[0_0_10px_rgba(74,222,128,0.1)]">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Validated
                  </span>
                </div>
                <div className="p-5 bg-zinc-950/80 text-zinc-300 font-mono text-sm overflow-x-auto">
                  <pre><code>{planResult.sql}</code></pre>
                </div>
                
                {planResult.warnings.length > 0 && (
                   <div className="px-5 py-3 bg-yellow-500/10 border-t border-yellow-500/20 text-yellow-500 text-xs flex flex-col gap-1.5">
                     {planResult.warnings.map((w, i) => <span key={i} className="flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5"/> {w}</span>)}
                   </div>
                )}
                
                <div className="px-5 py-4 border-t border-white/5 bg-black/20 flex justify-between items-center">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <AlertCircle className="w-3.5 h-3.5" /> Read-only execution mode
                  </div>
                  <button 
                    onClick={handleRunQuery}
                    disabled={isRunning}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 text-foreground rounded-lg text-sm font-medium hover:bg-primary hover:text-primary-foreground hover:shadow-[0_0_15px_rgba(56,189,248,0.4)] transition-all duration-300 disabled:opacity-50"
                  >
                    {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    Run Query
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground p-8 text-center animate-in fade-in duration-1000">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-[50px] rounded-full"></div>
                <Database className="w-16 h-16 mx-auto mb-6 opacity-30 relative z-10" />
                <p className="text-lg font-medium text-foreground/50 relative z-10">Ask a question to begin.</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Results & Insights */}
        <div className="flex-1 flex flex-col bg-transparent overflow-y-auto">
          {runResult ? (
            <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-6xl mx-auto w-full">
              <div className="flex items-center justify-between bg-black/20 backdrop-blur-lg border border-white/5 p-4 rounded-2xl shadow-xl">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-semibold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Query Results</h2>
                  <button 
                    onClick={handleExplain}
                    disabled={isExplaining || Boolean(insight)}
                    className="flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg text-sm font-medium hover:bg-primary/20 hover:shadow-[0_0_15px_rgba(56,189,248,0.2)] transition-all disabled:opacity-50"
                  >
                    {isExplaining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {insight ? "Insight Generated" : "Explain with AI"}
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground font-mono bg-black/40 px-3 py-1.5 rounded-md border border-white/5">Execution time: {runResult.time}ms</span>
                  <button 
                    onClick={handleExport}
                    disabled={isExporting}
                    className="flex items-center gap-2 px-4 py-1.5 bg-white/5 text-foreground border border-white/10 rounded-lg text-sm font-medium hover:bg-white/10 transition-all disabled:opacity-50"
                  >
                    {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    CSV
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-1.5 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bookmark className="w-4 h-4" />}
                    Save Workspace
                  </button>
                </div>
              </div>

              {/* Insight Narrative */}
              {insight && (
                <div className="p-6 rounded-2xl bg-black/40 backdrop-blur-xl border border-primary/30 shadow-[0_0_30px_rgba(56,189,248,0.15)] animate-in zoom-in-95 duration-500">
                  <h3 className="text-sm font-bold mb-3 text-primary flex items-center gap-2 uppercase tracking-wider">
                    <Sparkles className="w-5 h-5 fill-primary/20" /> AI Insight Narrative
                  </h3>
                  <p className="text-blue-50/90 leading-relaxed text-base">
                    {insight}
                  </p>
                </div>
              )}

              {/* Dynamic Chart */}
              {runResult.columns.length >= 2 && runResult.rows.length > 0 && (
                <div className="rounded-2xl border border-white/10 bg-black/20 backdrop-blur-md shadow-xl p-6 h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    {isTimeScale ? (
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey={runResult.columns[0]} stroke="rgba(255,255,255,0.4)" fontSize={12} tickMargin={10} />
                        <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickMargin={10} />
                        <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', borderRadius: '8px' }} />
                        <Line
                          type="monotone"
                          dataKey={runResult.columns[1]}
                          stroke="hsl(var(--primary))"
                          strokeWidth={3}
                          dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                      </LineChart>
                    ) : (
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey={runResult.columns[0]} stroke="rgba(255,255,255,0.4)" fontSize={12} tickMargin={10} />
                        <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickMargin={10} />
                        <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', borderRadius: '8px' }} />
                        <Bar
                          dataKey={runResult.columns[1]}
                          fill="hsl(var(--primary))"
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              )}

              {/* Data Table */}
              <div className="rounded-2xl border border-white/10 bg-black/20 backdrop-blur-md overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-foreground/90">
                    <thead className="text-xs uppercase tracking-wider text-muted-foreground bg-black/40 border-b border-white/10">
                      <tr>
                        {runResult.columns.map(col => (
                          <th key={col} className="px-6 py-4 font-semibold">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {runResult.rows.slice(0, 100).map((row, i) => (
                        <tr key={i} className="hover:bg-white/5 transition-colors duration-150">
                          {row.map((cell: any, j: number) => (
                            <td key={j} className="px-6 py-4">{String(cell)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {runResult.rows.length > 100 && (
                    <div className="p-4 text-center text-xs text-muted-foreground bg-black/20 font-medium tracking-wide">
                      Showing top 100 rows.
                    </div>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground p-8 text-center animate-in fade-in duration-1000">
              <div className="relative">
                <div className="absolute inset-0 bg-accent/20 blur-[60px] rounded-full"></div>
                <LineChartIcon className="w-16 h-16 mx-auto mb-6 opacity-30 relative z-10" />
                <p className="text-lg font-medium text-foreground/50 relative z-10">Results will appear here.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
