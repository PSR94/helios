import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SystemHealthBadge } from "../components/system-health-badge";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HELIOS - Analytics Copilot",
  description: "AI Analytics Engineering Copilot",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <div className="flex h-screen overflow-hidden">
          {/* Main Sidebar */}
          <aside className="w-64 border-r border-white/5 bg-black/20 backdrop-blur-xl flex flex-col relative z-20">
            <div className="h-16 flex items-center px-6 border-b border-white/5">
              <span className="font-black text-xl tracking-widest bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent drop-shadow-sm">HELIOS</span>
            </div>
            <nav className="flex-1 p-4 space-y-2 text-sm text-muted-foreground">
              <a href="/" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-all duration-200 group">
                <span className="group-hover:scale-110 transition-transform">Workspace</span>
              </a>
              <a href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 hover:text-foreground transition-all duration-200 group">
                <span className="group-hover:translate-x-1 transition-transform">Executive Dashboard</span>
              </a>
              <a href="/lineage" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 hover:text-foreground transition-all duration-200 group">
                <span className="group-hover:translate-x-1 transition-transform">Semantic Lineage</span>
              </a>
              <a href="/metrics" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 hover:text-foreground transition-all duration-200 group">
                <span className="group-hover:translate-x-1 transition-transform">Metric Catalog</span>
              </a>
              <a href="/saved" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 hover:text-foreground transition-all duration-200 group">
                <span className="group-hover:translate-x-1 transition-transform">Saved Workspaces</span>
              </a>
              <a href="/schema" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 hover:text-foreground transition-all duration-200 group">
                <span className="group-hover:translate-x-1 transition-transform">Schema Explorer</span>
              </a>
              <a href="/quality" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 hover:text-foreground transition-all duration-200 group">
                <span className="group-hover:translate-x-1 transition-transform">Data Quality Center</span>
              </a>
            </nav>
            <div className="p-4 border-t border-white/5 text-xs text-muted-foreground/50 font-medium">
              Environment: Local
            </div>
          </aside>
          
          {/* Main Content Area */}
          <main className="flex-1 flex flex-col relative overflow-hidden bg-transparent">
            <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-black/10 backdrop-blur-md z-10 shadow-sm">
              <h1 className="font-semibold text-lg text-foreground/90">Analytics Workspace</h1>
              <div className="flex items-center gap-4">
                <SystemHealthBadge />
              </div>
            </header>
            <div className="flex-1 overflow-auto">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
