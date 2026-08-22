"use client";

import { useEffect, useId, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown, Share2 } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
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
  const currencyLabelId = useId();
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
    <div className="currency-control">
      <span className="currency-label" id={currencyLabelId}>Cur</span>
      <Select.Root onValueChange={selectCurrency} value={initialCurrency}>
        <Select.Trigger
          aria-labelledby={currencyLabelId}
          className="currency-trigger"
          title="Display currency"
        >
          <Select.Value>{initialCurrency}</Select.Value>
          <Select.Icon className="currency-trigger-icon">
            <ChevronDown aria-hidden="true" size={12} />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content
            className="currency-menu"
            position="popper"
            sideOffset={4}
          >
            <Select.Viewport className="currency-menu-viewport">
              {currencies.map((currency) => (
                <Select.Item
                  className="currency-menu-item"
                  key={currency}
                  value={currency}
                >
                  <Select.ItemText>{currency}</Select.ItemText>
                  <Select.ItemIndicator className="currency-menu-check">
                    <Check aria-hidden="true" size={12} />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}

async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    try {
      textarea.select();
      if (!document.execCommand("copy")) {
        throw new Error("Clipboard copy failed");
      }
    } finally {
      textarea.remove();
    }
  }
}

export function ViewerActions() {
  async function shareUrl() {
    try {
      await copyText(window.location.href);
      toast.success("Shareable URL copied to clipboard", {
        position: "bottom-right",
      });
    } catch {
      toast.error("Failed to copy URL", { position: "bottom-right" });
    }
  }

  return (
    <>
      <div className="viewer-actions">
        <button className="toolbar-button share-button" onClick={shareUrl} type="button">
          <Share2 aria-hidden="true" size={14} />
          <span>Share URL</span>
        </button>
      </div>
      <Toaster />
    </>
  );
}
