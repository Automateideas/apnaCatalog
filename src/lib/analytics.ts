import { and, count, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { pageViews } from "@/db/schema";

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getAnalytics(shopId: string) {
  const [today, week, month, topPages, topReferrers, dailyViews] = await Promise.all([
    db
      .select({ views: count() })
      .from(pageViews)
      .where(and(eq(pageViews.shopId, shopId), gte(pageViews.createdAt, daysAgo(1)))),
    db
      .select({ views: count() })
      .from(pageViews)
      .where(and(eq(pageViews.shopId, shopId), gte(pageViews.createdAt, daysAgo(7)))),
    db
      .select({ views: count() })
      .from(pageViews)
      .where(and(eq(pageViews.shopId, shopId), gte(pageViews.createdAt, daysAgo(30)))),
    db
      .select({ path: pageViews.path, views: count() })
      .from(pageViews)
      .where(and(eq(pageViews.shopId, shopId), gte(pageViews.createdAt, daysAgo(30))))
      .groupBy(pageViews.path)
      .orderBy(sql`count(*) desc`)
      .limit(10),
    db
      .select({ referrer: pageViews.referrer, views: count() })
      .from(pageViews)
      .where(
        and(
          eq(pageViews.shopId, shopId),
          gte(pageViews.createdAt, daysAgo(30)),
          sql`${pageViews.referrer} is not null and ${pageViews.referrer} != ''`,
        ),
      )
      .groupBy(pageViews.referrer)
      .orderBy(sql`count(*) desc`)
      .limit(10),
    db
      .select({
        date: sql<string>`to_char(${pageViews.createdAt}, 'Mon DD')`,
        views: count(),
      })
      .from(pageViews)
      .where(and(eq(pageViews.shopId, shopId), gte(pageViews.createdAt, daysAgo(30))))
      .groupBy(sql`to_char(${pageViews.createdAt}, 'Mon DD')`)
      .orderBy(sql`to_char(${pageViews.createdAt}, 'Mon DD')`),
  ]);

  return {
    today: today[0]?.views ?? 0,
    week: week[0]?.views ?? 0,
    month: month[0]?.views ?? 0,
    topPages,
    topReferrers,
    dailyViews,
  };
}
