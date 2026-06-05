"use client";

import { useState } from "react";
import { FileText, MailCheck, Target } from "lucide-react";

type StatItem = {
  label: string;
  value: number | string;
  hint?: string;
};

export function DashboardStatsTabs({ daily, total }: { daily: StatItem[]; total: StatItem[] }) {
  const [activeTab, setActiveTab] = useState<"daily" | "total">("daily");
  const stats = activeTab === "daily" ? daily : total;
  const icons = activeTab === "daily" ? [MailCheck, FileText, Target] : [MailCheck, FileText, Target];

  return (
    <section className="dashboard-stats-tabs">
      <div className="segmented-tabs" role="tablist" aria-label="Dashboard stats range">
        <button
          aria-selected={activeTab === "daily"}
          className={activeTab === "daily" ? "active" : ""}
          role="tab"
          type="button"
          onClick={() => setActiveTab("daily")}
        >
          Daily
        </button>
        <button
          aria-selected={activeTab === "total"}
          className={activeTab === "total" ? "active" : ""}
          role="tab"
          type="button"
          onClick={() => setActiveTab("total")}
        >
          Total
        </button>
      </div>
      <div className="grid stats">
        {stats.map((stat, index) => (
          <Stat key={stat.label} icon={icons[index]} {...stat} />
        ))}
      </div>
    </section>
  );
}

function Stat({ label, value, hint, icon: Icon }: StatItem & { icon: typeof MailCheck }) {
  return (
    <div className="stat">
      <div className="stat-main">
        <span className="stat-icon" aria-hidden="true">
          <Icon size={22} />
        </span>
        <div>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      </div>
      {hint ? (
        <div className="stat-footer">
          <small>{hint}</small>
        </div>
      ) : null}
    </div>
  );
}
