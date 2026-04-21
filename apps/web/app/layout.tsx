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
          <aside className="w-64 border-r bg-muted/20 flex flex-col">
            <div className="h-14 flex items-center px-4 border-b">
              <span className="font-bold text-lg tracking-wider text-primary">HELIOS</span>
            </div>
            <nav className="flex-1 p-4 space-y-2 text-sm text-muted-foreground">
              <a href="/" className="flex items-center gap-3 px-3 py-2 rounded-md bg-secondary text-secondary-foreground font-medium">
                Workspace
              </a>
              <a href="/lineage" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/50 hover:text-foreground transition-colors">
                Semantic Lineage
              </a>
              <a href="/metrics" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/50 hover:text-foreground transition-colors">
                Metric Catalog
              </a>
              <a href="/saved" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/50 hover:text-foreground transition-colors">
                Saved Workspaces
              </a>
              <a href="/schema" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/50 hover:text-foreground transition-colors">
                Schema Explorer
              </a>
              <a href="/quality" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/50 hover:text-foreground transition-colors">
                Data Quality Center
              </a>
            </nav>
            <div className="p-4 border-t text-xs text-muted-foreground/70">
              Environment: Local
            </div>
          </aside>
          
          {/* Main Content Area */}
          <main className="flex-1 flex flex-col relative overflow-hidden bg-background">
            <header className="h-14 border-b flex items-center justify-between px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
              <h1 className="font-medium">Analytics Workspace</h1>
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
