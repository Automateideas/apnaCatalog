import { cx, initials } from "@/lib/utils";

/** Square logo, or the shop's initials on a colour when there is no logo. */
export function Avatar({
  name,
  src,
  color = "#1e3fae",
  className,
  round = false,
}: {
  name: string;
  src?: string | null;
  color?: string;
  className?: string;
  round?: boolean;
}) {
  const shape = round ? "rounded-full" : "rounded-2xl";
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        loading="lazy"
        className={cx("shrink-0 bg-white object-cover", shape, className)}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      style={{ background: color }}
      className={cx(
        "flex shrink-0 items-center justify-center font-bold text-white",
        shape,
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
