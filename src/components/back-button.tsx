"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function BackButton({ fallbackHref = "/leads", label = "Back" }: { fallbackHref?: string; label?: string }) {
  const router = useRouter();

  function goBack() {
    const referrer = document.referrer;
    if (referrer) {
      try {
        const referrerUrl = new URL(referrer);
        if (referrerUrl.origin === window.location.origin && referrerUrl.pathname.startsWith("/email-log")) {
          router.back();
          return;
        }
      } catch {
        // Fall back to the lead list if the referrer cannot be parsed.
      }
    }

    router.push(fallbackHref);
  }

  return (
    <button className="button secondary" type="button" onClick={goBack}>
      <ArrowLeft size={16} /> {label}
    </button>
  );
}
