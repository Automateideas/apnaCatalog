import { redirect } from "next/navigation";
import { getShopByOwner, requireUser } from "@/lib/auth";
import { siteUrl } from "@/lib/utils";
import { OnboardingForm } from "./OnboardingForm";

export default async function NewShopPage() {
  const user = await requireUser();
  if (await getShopByOwner(user.id)) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-bold text-slate-900">Set up your shop</h1>
      <p className="mt-1 mb-5 text-slate-600">Four details and your catalog link is ready.</p>
      <OnboardingForm host={new URL(siteUrl()).host} />
    </div>
  );
}
