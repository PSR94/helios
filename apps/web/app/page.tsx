"use client"

import { useState } from "react";
import { Sparkles, Terminal, Database, LineChart as LineChartIcon, Play, AlertCircle, CheckCircle2, ChevronRight, Loader2, Bookmark } from "lucide-react";
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
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      <div className="p-6 border-b bg-muted/10">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleGenerate} className="relative group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-muted-foreground">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-12 pr-32 py-4 bg-background border border-border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-lg"
              placeholder="Ask a business question... (e.g. 'Show me daily active users for Pro tier this month')"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-2">
              <button
                type="submit"
                disabled={isPlanning || !query}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2"
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
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Context & SQL */}
        <div className="w-1/3 min-w-[400px] border-r flex flex-col bg-background/50 overflow-y-auto">
          {planResult ? (
            <div className="p-6 space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
              
              <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b flex items-center justify-between bg-muted/20">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-medium text-sm">Generated SQL</h3>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-green-500 bg-green-500/10 px-2 py-1 rounded border border-green-500/20">
                    <CheckCircle2 className="w-3 h-3" /> Validated
                  </span>
                </div>
                <div className="p-4 bg-zinc-950 text-zinc-300 font-mono text-sm overflow-x-auto">
                  <pre><code>{planResult.sql}</code></pre>
                </div>
                
                {planResult.warnings.length > 0 && (
                   <div className="px-4 py-2 bg-yellow-500/10 border-t border-yellow-500/20 text-yellow-500 text-xs flex flex-col gap-1">
                     {planResult.warnings.map((w, i) => <span key={i} className="flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {w}</span>)}
                   </div>
                )}
                
                <div className="px-4 py-3 border-t bg-muted/10 flex justify-between items-center">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <AlertCircle className="w-3 h-3" /> Read-only execution mode
                  </div>
                  <button 
                    onClick={handleRunQuery}
                    disabled={isRunning}
                    className="flex items-center gap-2 px-3 py-1.5 bg-secondary text-secondary-foreground rounded text-sm hover:bg-secondary/80 transition-colors disabled:opacity-50"
                  >
                    {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-3 h-3" />}
                    Run Query
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground p-8 text-center">
              <div>
                <Database className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>Ask a question to see the semantic resolution and SQL generation.</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Results & Insights */}
        <div className="flex-1 flex flex-col bg-background overflow-y-auto">
          {runResult ? (
            <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-medium">Query Results</h2>
                  <button 
                    onClick={handleExplain}
                    disabled={isExplaining || Boolean(insight)}
                    className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md text-xs hover:bg-blue-500/20 transition-all disabled:opacity-50"
                  >
                    {isExplaining ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    {insight ? "Insight Generated" : "Explain with AI"}
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Execution time: {runResult.time}ms</span>
                  <button 
                    onClick={handleSave}
                    disabled={isSaving || isSaved}
                    className={`flex items-center gap-2 px-3 py-1 rounded-md text-xs transition-all ${
                      isSaved 
                      ? "bg-green-500/10 text-green-500 border border-green-500/20" 
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bookmark className="w-3 h-3" />}
                    {isSaved ? "Saved" : "Save Workspace"}
                  </button>
                </div>
              </div>

              {/* Insight Narrative */}
              {insight && (
                <div className="p-5 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border border-blue-500/20 animate-in zoom-in-95 duration-500">
                  <h3 className="text-sm font-semibold mb-2 text-blue-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> AI Insight Narrative
                  </h3>
                  <p className="text-blue-100/90 leading-relaxed text-sm">
                    {insight}
                  </p>
                </div>
              )}

              {/* Dynamic Chart */}
              {runResult.columns.length >= 2 && runResult.rows.length > 0 && (
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    {isTimeScale ? (
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey={runResult.columns[0]} stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }} />
                        <Line
                          type="monotone"
                          dataKey={runResult.columns[1]}
                          stroke="#38bdf8"
                          strokeWidth={2}
                        />
                      </LineChart>
                    ) : (
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey={runResult.columns[0]} stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }} />
                        <Bar
                          dataKey={runResult.columns[1]}
                          fill="#38bdf8"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              )}

              {/* Data Table */}
              <div className="rounded-xl border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground bg-muted/50 border-b">
                      <tr>
                        {runResult.columns.map(col => (
                          <th key={col} className="px-6 py-3 font-medium">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {runResult.rows.slice(0, 100).map((row, i) => (
                        <tr key={i} className="border-b border-border/50 hover:bg-muted/20">
                          {row.map((cell: any, j: number) => (
                            <td key={j} className="px-6 py-3">{String(cell)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {runResult.rows.length > 100 && (
                    <div className="p-3 text-center text-xs text-muted-foreground bg-muted/20">
                      Showing top 100 rows.
                    </div>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground p-8 text-center">
              <div>
                <LineChartIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>Query results and insights will appear here.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
