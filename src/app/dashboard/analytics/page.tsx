import { BarChart3, Eye, Globe, TrendingUp } from "lucide-react";
import { requireShop } from "@/lib/auth";
import { getAnalytics } from "@/lib/analytics";
import { Card } from "@/components/ui/card";

export default async function AnalyticsPage() {
  const { shop } = await requireShop();
  const stats = await getAnalytics(shop.id);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">Analytics</h1>

      <section className="grid grid-cols-3 gap-3">
        {[
          { label: "Today", value: stats.today, icon: Eye },
          { label: "This week", value: stats.week, icon: TrendingUp },
          { label: "This month", value: stats.month, icon: BarChart3 },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center gap-2 text-slate-500">
              <s.icon className="size-4" />
              <span className="text-xs font-medium">{s.label}</span>
            </div>
            <p className="mt-1 text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-slate-500">page views</p>
          </Card>
        ))}
      </section>

      {stats.dailyViews.length > 0 && (
        <Card className="p-5">
          <h2 className="mb-3 font-bold">Daily views (last 30 days)</h2>
          <div className="flex items-end gap-1" style={{ height: 120 }}>
            {stats.dailyViews.map((d) => {
              const max = Math.max(...stats.dailyViews.map((x) => x.views), 1);
              const h = Math.max((d.views / max) * 100, 4);
              return (
                <div key={d.date} className="group relative flex flex-1 flex-col items-center">
                  <span className="pointer-events-none absolute -top-6 hidden rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-white group-hover:block">
                    {d.views}
                  </span>
                  <div
                    className="w-full rounded-t bg-brand"
                    style={{ height: `${h}%` }}
                    title={`${d.date}: ${d.views} views`}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-1 flex gap-1 overflow-hidden">
            {stats.dailyViews.map((d, i) =>
              i % 5 === 0 ? (
                <span key={d.date} className="flex-1 text-center text-[9px] text-slate-400">
                  {d.date}
                </span>
              ) : (
                <span key={d.date} className="flex-1" />
              ),
            )}
          </div>
        </Card>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-3 flex items-center gap-2 font-bold">
            <Eye className="size-4" /> Top pages
          </h2>
          {stats.topPages.length === 0 ? (
            <p className="text-sm text-slate-500">No data yet</p>
          ) : (
            <ul className="space-y-2">
              {stats.topPages.map((p) => (
                <li key={p.path} className="flex items-center justify-between text-sm">
                  <span className="truncate text-slate-700">{p.path}</span>
                  <span className="ml-2 shrink-0 font-medium">{p.views}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 flex items-center gap-2 font-bold">
            <Globe className="size-4" /> Top referrers
          </h2>
          {stats.topReferrers.length === 0 ? (
            <p className="text-sm text-slate-500">No data yet</p>
          ) : (
            <ul className="space-y-2">
              {stats.topReferrers.map((r) => (
                <li key={r.referrer} className="flex items-center justify-between text-sm">
                  <span className="truncate text-slate-700">{r.referrer}</span>
                  <span className="ml-2 shrink-0 font-medium">{r.views}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
