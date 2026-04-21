"use client"

import { useEffect, useState } from "react"
import { Database, Table as TableIcon, Columns, Layout, ShieldCheck, RefreshCw, AlertCircle, ChevronRight } from "lucide-react"
import { apiUrl } from "../../lib/api"

type Dataset = {
  id: string;
  name: string;
  trust_tier: string;
}

type ColumnInfo = {
  name: string;
  type: string;
}

export default function SchemaExplorer() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const [columnInfo, setColumnInfo] = useState<ColumnInfo[]>([]);
  const [sampleRows, setSampleRows] = useState<any[][]>([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const res = await fetch(apiUrl("/api/v1/schema/datasets"));
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Failed to fetch datasets");
        setDatasets(data.datasets);
        if (data.datasets.length > 0) {
          handleSelectDataset(data.datasets[0].id);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDatasets();
  }, []);

  const handleSelectDataset = async (id: string) => {
    setSelectedDataset(id);
    setDetailLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/v1/schema/datasets/${id}/columns`));
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to fetch column info");
      setColumnInfo(data.columns);
      setSampleRows(data.sample_rows);
    } catch (err: any) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="p-8 max-w-7xl mx-auto w-full flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 border-b pb-6 mb-6">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Layout className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Schema Explorer</h1>
            <p className="text-muted-foreground mt-1">Browse physical datasets, types, and sample records in DuckDB.</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Indexing physical storage...
          </div>
        ) : (
          <div className="flex-1 flex gap-8 overflow-hidden">
            {/* Sidebar: Table List */}
            <div className="w-64 flex flex-col border rounded-xl overflow-hidden bg-card/50">
              <div className="px-4 py-3 bg-muted/30 border-b flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <TableIcon className="w-3.5 h-3.5" /> Tables
              </div>
              <div className="flex-1 overflow-y-auto">
                {datasets.map((ds) => (
                  <button
                    key={ds.id}
                    onClick={() => handleSelectDataset(ds.id)}
                    className={`w-full text-left px-4 py-3 border-b border-border/50 transition-colors flex items-center justify-between group ${
                      selectedDataset === ds.id ? 'bg-secondary text-secondary-foreground' : 'hover:bg-muted/50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Database className="w-4 h-4 opacity-50" />
                      {ds.name}
                    </span>
                    <ChevronRight className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-50 transition-opacity ${selectedDataset === ds.id ? 'opacity-100' : ''}`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Content: Column Info & Samples */}
            <div className="flex-1 flex flex-col gap-6 overflow-hidden">
              {detailLoading ? (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                   <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Reading table metadata...
                </div>
              ) : selectedDataset ? (
                <>
                  {/* Table Stats Card */}
                  <div className="p-4 rounded-xl border bg-gradient-to-r from-muted/20 to-transparent flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="p-2 bg-green-500/10 rounded-lg border border-green-500/20">
                          <ShieldCheck className="w-5 h-5 text-green-500" />
                       </div>
                       <div>
                          <div className="font-semibold text-lg">{selectedDataset}</div>
                          <div className="text-sm text-muted-foreground">Tier: Gold | Location: local://duckdb/{selectedDataset}</div>
                       </div>
                    </div>
                    <div className="flex gap-8">
                       <div className="text-right">
                          <div className="text-xs text-muted-foreground uppercase font-semibold">Columns</div>
                          <div className="text-xl font-bold">{columnInfo.length}</div>
                       </div>
                    </div>
                  </div>

                  <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
                    {/* Columns List */}
                    <div className="border rounded-xl bg-card overflow-hidden flex flex-col">
                      <div className="px-4 py-3 bg-muted/30 border-b flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <Columns className="w-3.5 h-3.5" /> Fields & Types
                      </div>
                      <div className="flex-1 overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead className="sticky top-0 bg-card border-b text-xs text-muted-foreground uppercase">
                            <tr>
                              <th className="px-4 py-2 text-left font-medium">Field</th>
                              <th className="px-4 py-2 text-left font-medium">Type</th>
                            </tr>
                          </thead>
                          <tbody>
                            {columnInfo.map((col) => (
                              <tr key={col.name} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                                <td className="px-4 py-3 font-mono text-primary/80">{col.name}</td>
                                <td className="px-4 py-3">
                                  <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase">
                                    {col.type}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Sample Data */}
                    <div className="border rounded-xl bg-card overflow-hidden flex flex-col">
                       <div className="px-4 py-3 bg-muted/30 border-b flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <Layout className="w-3.5 h-3.5" /> Sample Records
                      </div>
                      <div className="flex-1 overflow-auto">
                        <table className="w-full text-[12px]">
                          <thead className="sticky top-0 bg-card border-b text-muted-foreground uppercase">
                            <tr>
                              {columnInfo.map(col => (
                                <th key={col.name} className="px-4 py-2 text-left font-medium whitespace-nowrap">{col.name}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {sampleRows.map((row, i) => (
                              <tr key={i} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                                {row.map((cell, j) => (
                                  <td key={j} className="px-4 py-2 whitespace-nowrap opacity-80">{String(cell)}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl">
                  Select a table to browse its schema and sample data.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
