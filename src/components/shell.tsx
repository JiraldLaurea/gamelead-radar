import { SidebarNav } from "./sidebar-nav";
import Link from "next/link";
import { AutomationStatusBar } from "./automation-status-bar";
import { getAutomationStatus } from "@/lib/automation-runner";

export function Shell({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/">GameLead Radar</Link>
        <SidebarNav />
      </aside>
      <main className="main">
        <AutomationStatusBarLoader />
        <div className="topbar">
          <div>
            <h1>{title}</h1>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}

async function AutomationStatusBarLoader() {
  const status = await getAutomationStatus();
  return <AutomationStatusBar initialStatus={status} />;
}
