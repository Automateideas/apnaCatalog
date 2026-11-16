import { parseIconSize, renderIcon } from "@/lib/icon";

export async function GET(_request: Request, ctx: RouteContext<"/app-icon/[size]">) {
  const { size } = await ctx.params;
  return renderIcon({ size: parseIconSize(size), text: "A", background: "#1b2340" });
}
