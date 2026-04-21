"use client"

import { useEffect, useState } from "react"
import { ShieldCheck, ShieldAlert, Shield, CheckCircle2, AlertCircle, Clock, Database, BarChart3, RefreshCw } from "lucide-react"
import { apiUrl } from "../../lib/api"

type QualityCheck = {
  target: string;
  check: string;
  status: 'passed' | 'warning' | 'failed';
  value: any;
  message: string;
}

export default function DataQualityCenter() {
  const [checks, setChecks] = useState<QualityCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/v1/data-quality/status"));
      const data = await res.json();
      if (data.status === 'error') throw new Error(data.message);
      setChecks(data.checks);
      setLastRun(data.last_run);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'failed': return <ShieldAlert className="w-5 h-5 text-red-500" />;
      default: return <Shield className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="p-8 max-w-6xl mx-auto w-full space-y-8">
        <div className="flex items-center justify-between border-b pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Data Quality Center</h1>
              <p className="text-muted-foreground mt-1">Real-time trust signals and freshness indicators for analytics datasets.</p>
            </div>
          </div>
          <button 
            onClick={fetchStatus}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        )}

        <div className="grid gap-6">
          {loading && checks.length === 0 ? (
            <div className="py-20 flex items-center justify-center text-muted-foreground">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Auditing analytics storage...
            </div>
          ) : (
            <div className="grid gap-4">
              {checks.map((check, i) => (
                <div key={i} className={`p-6 rounded-xl border bg-card/50 flex items-center justify-between group transition-all hover:border-primary/30 ${
                  check.status === 'failed' ? 'border-red-500/30' : check.status === 'warning' ? 'border-yellow-500/30' : ''
                }`}>
                  <div className="flex items-center gap-6">
                    <div className={`p-3 rounded-xl ${
                      check.status === 'passed' ? 'bg-green-500/10' : check.status === 'warning' ? 'bg-yellow-500/10' : 'bg-red-500/10'
                    }`}>
                      {getStatusIcon(check.status)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg capitalize">{check.target}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{check.check}</span>
                      </div>
                      <p className="text-muted-foreground mt-1">{check.message}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-8">
                     <div className="text-right">
                        <div className="text-xs text-muted-foreground uppercase font-semibold">Value</div>
                        <div className="font-mono text-lg">{check.value}</div>
                     </div>
                     <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
                       check.status === 'passed' ? 'bg-green-500/10 text-green-500' : check.status === 'warning' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'
                     }`}>
                       {check.status}
                     </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {lastRun && (
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-8">
             <Clock className="w-3.5 h-3.5" /> Last audited: {new Date(lastRun).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  )
}
