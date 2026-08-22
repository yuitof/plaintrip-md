"use client";

import { useMemo, useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check, Clipboard, RotateCcw, Share2 } from "lucide-react";

const fallbackTimezones = [
  "UTC",
  "America/Los_Angeles",
  "America/New_York",
  "Europe/Lisbon",
  "Europe/London",
  "Europe/Paris",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Australia/Sydney",
];

function availableTimezones(): string[] {
  try {
    const supported = Intl.supportedValuesOf("timeZone");
    return ["UTC", ...supported.filter((timezone) => timezone !== "UTC")];
  } catch {
    return fallbackTimezones;
  }
}

export function TimezoneControl({ initialTimezone }: { initialTimezone: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialTimezone);
  const options = useMemo(availableTimezones, []);

  function apply(timezone: string) {
    try {
      new Intl.DateTimeFormat("en", { timeZone: timezone }).format();
    } catch {
      return;
    }
    const next = new URLSearchParams(searchParams.toString());
    next.set("tz", timezone);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    apply(value.trim());
  }

  function useDeviceTimezone() {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    setValue(timezone);
    apply(timezone);
  }

  return (
    <div className="timezone-tools">
      <form className="timezone-form" onSubmit={submit}>
        <label htmlFor="viewer-timezone">TZ</label>
        <input
          aria-label="Display timezone"
          id="viewer-timezone"
          list="viewer-timezones"
          onChange={(event) => setValue(event.target.value)}
          spellCheck={false}
          value={value}
        />
        <datalist id="viewer-timezones">
          {options.map((timezone) => <option key={timezone} value={timezone} />)}
        </datalist>
        <button aria-label="Apply timezone" title="Apply timezone" type="submit">
          <Check aria-hidden="true" size={14} />
        </button>
      </form>
      <button
        className="toolbar-button device-timezone"
        onClick={useDeviceTimezone}
        title="Use device timezone"
        type="button"
      >
        <RotateCcw aria-hidden="true" size={14} />
        <span>Device TZ</span>
      </button>
    </div>
  );
}

export function ViewerActions({ source }: { source: string }) {
  const [copyLabel, setCopyLabel] = useState("Copy Markdown");
  const [shareLabel, setShareLabel] = useState("Share URL");

  async function copyMarkdown() {
    try {
      await navigator.clipboard.writeText(source);
      setCopyLabel("Copied");
      window.setTimeout(() => setCopyLabel("Copy Markdown"), 1600);
    } catch {
      setCopyLabel("Copy failed");
    }
  }

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
      <button className="toolbar-button" onClick={copyMarkdown} type="button">
        <Clipboard aria-hidden="true" size={14} />
        <span>{copyLabel}</span>
      </button>
      <button className="toolbar-button share-button" onClick={shareUrl} type="button">
        <Share2 aria-hidden="true" size={14} />
        <span>{shareLabel}</span>
      </button>
    </div>
  );
}
