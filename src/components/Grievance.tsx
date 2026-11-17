import { SITE_NAME } from "@/lib/utils";

/**
 * Grievance Officer contact, required by the IT Rules 2011 / 2021 and the DPDP Act 2023.
 * The name and email come from the environment (GRIEVANCE_OFFICER_NAME, GRIEVANCE_EMAIL) so no
 * personal detail is written into the code; until they are set, the support WhatsApp is shown.
 */
export function Grievance() {
  const name = process.env.GRIEVANCE_OFFICER_NAME?.trim();
  const email = process.env.GRIEVANCE_EMAIL?.trim();
  const whatsapp = (process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? "").replace(/\D/g, "");

  return (
    <>
      <h2 className="pt-2 text-lg font-bold text-slate-900">Grievance Officer</h2>
      <p>
        For any complaint about your data or about content on {SITE_NAME}, contact our Grievance
        Officer{name ? <>, <strong>{name}</strong></> : ""}:
      </p>
      <ul className="list-disc space-y-1 pl-5">
        {email && (
          <li>
            Email:{" "}
            <a href={`mailto:${email}`} className="text-brand underline">
              {email}
            </a>
          </li>
        )}
        {whatsapp && (
          <li>
            WhatsApp:{" "}
            <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="text-brand underline">
              +{whatsapp}
            </a>
          </li>
        )}
      </ul>
      <p>
        We acknowledge a complaint within 24 hours and resolve it within 15 days. A request to
        remove content that shows a person in a sexual or intimate way, or impersonates them, is
        acted on within 24 hours.
      </p>
    </>
  );
}
