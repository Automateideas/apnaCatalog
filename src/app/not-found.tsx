import Link from "next/link";
import { IconBadge } from "@/components/Icon";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      <IconBadge name="search" />
      <h1 className="mt-4 text-xl font-bold">Page not found</h1>
      <p className="mt-2 text-slate-600">
        This shop or page does not exist. The link may be wrong or the shop may have closed.
      </p>
      <Link href="/" className={buttonVariants({ className: "mt-6" })}>
        See all shops
      </Link>
    </main>
  );
}
