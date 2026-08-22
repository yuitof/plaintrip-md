"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Share2 } from "lucide-react";
import { COMMON_CURRENCIES } from "@/lib/currency";
import { DEVICE_TIMEZONE_COOKIE } from "@/lib/view-options";

export function TimezoneReadout({
  detectDevice,
  timezone,
}: {
  detectDevice: boolean;
  timezone: string;
}) {
  const router = useRouter();
  const [label, setLabel] = useState(timezone);

  useEffect(() => {
    if (!detectDevice) {
      setLabel(timezone);
      return;
    }
    const deviceTimezone =
      Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    setLabel(deviceTimezone);
    if (deviceTimezone === timezone) return;
    document.cookie = `${DEVICE_TIMEZONE_COOKIE}=${encodeURIComponent(deviceTimezone)}; Path=/; Max-Age=31536000; SameSite=Lax`;
    router.refresh();
  }, [detectDevice, router, timezone]);

  return (
    <div
      className="timezone-readout"
      title={detectDevice ? "Device timezone" : "Timezone declared by this itinerary"}
    >
      <span>TZ</span>
      <output>{label}</output>
    </div>
  );
}

export function CurrencyControl({ initialCurrency }: { initialCurrency: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currencies = COMMON_CURRENCIES.includes(
    initialCurrency as (typeof COMMON_CURRENCIES)[number],
  )
    ? COMMON_CURRENCIES
    : [initialCurrency, ...COMMON_CURRENCIES];

  function selectCurrency(currency: string) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("cur", currency);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  return (
    <label className="currency-form">
      <span>Cur</span>
      <select
        aria-label="Display currency"
        onChange={(event) => selectCurrency(event.target.value)}
        value={initialCurrency}
      >
        {currencies.map((currency) => (
          <option key={currency} value={currency}>{currency}</option>
        ))}
      </select>
    </label>
  );
}

export function ViewerActions() {
  const [shareLabel, setShareLabel] = useState("Share URL");

  async function shareUrl() {
    try {
      if (navigator.share) {
        await navigator.share({ title: document.title, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setShareLabel("URL copied");
        window.setTimeout(() => setShareLabel("Share URL"), 1600);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setShareLabel("Share failed");
    }
  }

  return (
    <div className="viewer-actions">
      <button className="toolbar-button share-button" onClick={shareUrl} type="button">
        <Share2 aria-hidden="true" size={14} />
        <span>{shareLabel}</span>
      </button>
    </div>
  );
}
