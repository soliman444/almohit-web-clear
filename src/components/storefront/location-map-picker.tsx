"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  DEFAULT_COUNTRY_CODE,
  countryByCode,
  normalizeCountryCode,
} from "../../lib/geo/countries";
import { CountrySelect } from "./country-select";

type LeafletMap = {
  setView: (center: [number, number], zoom: number) => void;
  on: (event: string, handler: (e: { latlng: { lat: number; lng: number } }) => void) => void;
  off: (event: string) => void;
  remove: () => void;
  removeLayer: (layer: LeafletMarker) => void;
  invalidateSize?: () => void;
};

type LeafletMarker = {
  setLatLng: (latlng: [number, number]) => void;
  getLatLng: () => { lat: number; lng: number };
  on: (event: string, handler: () => void) => void;
  addTo: (map: LeafletMap) => LeafletMarker;
};

type LeafletNs = {
  map: (el: HTMLElement, opts?: { scrollWheelZoom?: boolean }) => LeafletMap;
  tileLayer: (url: string, opts?: Record<string, unknown>) => { addTo: (map: LeafletMap) => void };
  marker: (latlng: [number, number], opts?: { draggable?: boolean }) => LeafletMarker;
  Icon: {
    Default: {
      prototype: { _getIconUrl?: unknown };
      mergeOptions: (opts: Record<string, string>) => void;
    };
  };
};

declare global {
  interface Window {
    L?: LeafletNs;
  }
}

let leafletLoader: Promise<LeafletNs> | null = null;

function loadLeaflet(): Promise<LeafletNs> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Leaflet requires a browser."));
  }
  if (window.L) return Promise.resolve(window.L);
  if (leafletLoader) return leafletLoader;

  leafletLoader = new Promise((resolve, reject) => {
    const cssId = "leaflet-css-cdn";
    if (!document.getElementById(cssId)) {
      const link = document.createElement("link");
      link.id = cssId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      link.crossOrigin = "";
      document.head.appendChild(link);
    }

    const existing = document.querySelector<HTMLScriptElement>("script[data-leaflet-cdn]");
    if (existing) {
      existing.addEventListener("load", () => {
        if (window.L) resolve(window.L);
        else reject(new Error("Leaflet failed to load."));
      });
      existing.addEventListener("error", () => reject(new Error("Leaflet failed to load.")));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.crossOrigin = "";
    script.dataset.leafletCdn = "1";
    script.async = true;
    script.onload = () => {
      if (!window.L) {
        reject(new Error("Leaflet failed to load."));
        return;
      }
      // eslint-disable-next-line no-underscore-dangle
      delete (window.L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
      window.L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
      resolve(window.L);
    };
    script.onerror = () => reject(new Error("Leaflet failed to load."));
    document.body.appendChild(script);
  });

  return leafletLoader;
}

function parseCoord(value?: number | string | null): number | null {
  if (value === null || value === undefined || value === "") return null;
  const next = typeof value === "number" ? value : Number(value);
  return Number.isFinite(next) ? next : null;
}

export function LocationMapPicker({
  countryCode = DEFAULT_COUNTRY_CODE,
  defaultLatitude,
  defaultLongitude,
  latitudeName = "latitude",
  longitudeName = "longitude",
  readOnly = false,
  className,
}: {
  countryCode?: string | null;
  defaultLatitude?: number | string | null;
  defaultLongitude?: number | string | null;
  latitudeName?: string;
  longitudeName?: string;
  readOnly?: boolean;
  className?: string;
}) {
  const mapId = useId().replace(/:/g, "");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lat, setLat] = useState<string>(() => {
    const value = parseCoord(defaultLatitude);
    return value == null ? "" : String(value);
  });
  const [lng, setLng] = useState<string>(() => {
    const value = parseCoord(defaultLongitude);
    return value == null ? "" : String(value);
  });

  const code = normalizeCountryCode(countryCode);
  const country = countryByCode(code) ?? countryByCode(DEFAULT_COUNTRY_CODE)!;

  useEffect(() => {
    if (readOnly || !containerRef.current) return;
    let cancelled = false;

    loadLeaflet()
      .then((L) => {
        if (cancelled || !containerRef.current || mapRef.current) return;
        const startLat = parseCoord(defaultLatitude) ?? country.center[0];
        const startLng = parseCoord(defaultLongitude) ?? country.center[1];
        const zoom = parseCoord(defaultLatitude) != null ? 14 : (country.zoom ?? 6);

        const map = L.map(containerRef.current, { scrollWheelZoom: false });
        map.setView([startLat, startLng], zoom);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);

        const placeMarker = (nextLat: number, nextLng: number) => {
          if (markerRef.current) {
            markerRef.current.setLatLng([nextLat, nextLng]);
          } else {
            const marker = L.marker([nextLat, nextLng], { draggable: true }).addTo(map);
            marker.on("dragend", () => {
              const pos = marker.getLatLng();
              setLat(String(pos.lat));
              setLng(String(pos.lng));
            });
            markerRef.current = marker;
          }
          setLat(String(nextLat));
          setLng(String(nextLng));
        };

        if (parseCoord(defaultLatitude) != null && parseCoord(defaultLongitude) != null) {
          placeMarker(startLat, startLng);
        }

        map.on("click", (event) => {
          placeMarker(event.latlng.lat, event.latlng.lng);
        });

        mapRef.current = map;
        setReady(true);
        requestAnimationFrame(() => {
          map.invalidateSize?.();
        });
      })
      .catch(() => {
        if (!cancelled) setError("Map could not load. You can still submit without a pin.");
      });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.off("click");
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly]);

  useEffect(() => {
    if (!mapRef.current || !ready) return;
    const hasPin = lat !== "" && lng !== "";
    if (hasPin) return;
    mapRef.current.setView(country.center, country.zoom ?? 6);
  }, [code, country.center, country.zoom, lat, lng, ready]);

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError("Location is not available in this browser.");
      return;
    }
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLat = position.coords.latitude;
        const nextLng = position.coords.longitude;
        setLat(String(nextLat));
        setLng(String(nextLng));
        if (mapRef.current) {
          mapRef.current.setView([nextLat, nextLng], 15);
          if (markerRef.current) {
            markerRef.current.setLatLng([nextLat, nextLng]);
          } else if (window.L && mapRef.current) {
            const marker = window.L.marker([nextLat, nextLng], { draggable: true }).addTo(mapRef.current);
            marker.on("dragend", () => {
              const pos = marker.getLatLng();
              setLat(String(pos.lat));
              setLng(String(pos.lng));
            });
            markerRef.current = marker;
          }
        }
      },
      () => setError("Could not read your location. Allow location access or tap the map."),
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }

  function clearPin() {
    setLat("");
    setLng("");
    if (mapRef.current && markerRef.current) {
      mapRef.current.removeLayer(markerRef.current);
      markerRef.current = null;
    }
  }

  if (readOnly) {
    const shownLat = parseCoord(defaultLatitude);
    const shownLng = parseCoord(defaultLongitude);
    return (
      <div className={["sf-biz-field", "is-span-2", "sf-map-readonly", className].filter(Boolean).join(" ")}>
        <span>Map location</span>
        <p className="sf-biz-readonly">
          {shownLat != null && shownLng != null
            ? `${shownLat.toFixed(5)}, ${shownLng.toFixed(5)}`
            : "—"}
        </p>
      </div>
    );
  }

  return (
    <div className={["sf-map-picker", "is-span-2", className].filter(Boolean).join(" ")}>
      <div className="sf-map-picker-head">
        <div>
          <p className="sf-map-picker-label">Map pin (optional)</p>
          <p className="sf-map-picker-hint">Tap the map or drag the marker to set the shop location.</p>
        </div>
        <div className="sf-map-picker-actions">
          <button type="button" className="sf-btn is-ghost sf-map-btn" onClick={useMyLocation}>
            Use my location
          </button>
          {(lat || lng) && (
            <button type="button" className="sf-btn is-ghost sf-map-btn" onClick={clearPin}>
              Clear pin
            </button>
          )}
        </div>
      </div>
      <div
        id={`sf-map-${mapId}`}
        ref={containerRef}
        className="sf-map-canvas"
        role="application"
        aria-label="Location map"
      />
      {!ready && !error && <p className="sf-map-status">Loading map…</p>}
      {error && <p className="sf-map-status is-error">{error}</p>}
      <input type="hidden" name={latitudeName} value={lat} />
      <input type="hidden" name={longitudeName} value={lng} />
    </div>
  );
}

export function LocationFields({
  defaultCountryCode,
  defaultLatitude,
  defaultLongitude,
  readOnly = false,
  invalidCountry = false,
}: {
  defaultCountryCode?: string | null;
  defaultLatitude?: number | string | null;
  defaultLongitude?: number | string | null;
  readOnly?: boolean;
  invalidCountry?: boolean;
}) {
  const [countryCode, setCountryCode] = useState(() => normalizeCountryCode(defaultCountryCode));

  if (readOnly) {
    const country = countryByCode(defaultCountryCode);
    return (
      <>
        <div className={["sf-biz-field", invalidCountry ? "is-invalid" : ""].filter(Boolean).join(" ")}>
          <span>Country</span>
          <p className="sf-biz-readonly">{country?.name ?? "—"}</p>
        </div>
        <LocationMapPicker
          countryCode={defaultCountryCode}
          defaultLatitude={defaultLatitude}
          defaultLongitude={defaultLongitude}
          readOnly
        />
      </>
    );
  }

  return (
    <>
      <CountrySelect
        defaultValue={countryCode}
        invalid={invalidCountry}
        onChange={setCountryCode}
      />
      <LocationMapPicker
        key={countryCode}
        countryCode={countryCode}
        defaultLatitude={defaultLatitude}
        defaultLongitude={defaultLongitude}
      />
    </>
  );
}
