import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { LiveVehicleLocation } from "../../types";
import { getLiveVehicleLocations } from "../../services/api";
import { onGpsUpdate } from "../../services/socket";
import { Card, th } from "../ui";

const YANGON_CENTER: [number, number] = [16.85, 96.15];
const DEFAULT_ZOOM = 11;

function speedLabel(s: number): string {
  return `${Math.round(s)} km/h`;
}

export default function LiveVehicleMap() {
  const [locations, setLocations] = useState<LiveVehicleLocation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [syncedAt, setSyncedAt] = useState<Date | null>(null);

  useEffect(() => {
    let active = true;

    getLiveVehicleLocations()
      .then((data) => {
        if (!active) return;
        setLocations(data);
        setSyncedAt(new Date());
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load live locations");
      });

    const off = onGpsUpdate((data) => {
      if (!active) return;
      setLocations(data);
      setSyncedAt(new Date());
    });

    return () => {
      active = false;
      off();
    };
  }, []);

  const activeCount = useMemo(
    () => locations.filter((l) => l.onActiveTrip).length,
    [locations]
  );
  const movingCount = useMemo(
    () => locations.filter((l) => l.speed > 0).length,
    [locations]
  );

  return (
    <Card className="p-4 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h3 className="font-semibold flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          Live Vehicle Locations
        </h3>
        <div className={`flex items-center gap-4 text-xs ${th.textMuted}`}>
          <span>
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1" />
            On trip ({activeCount})
          </span>
          <span>
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-sky-500 mr-1" />
            Idle ({locations.length - activeCount})
          </span>
          <span>Moving: {movingCount}</span>
          {syncedAt && <span>Updated {syncedAt.toLocaleTimeString()}</span>}
        </div>
      </div>

      {error && (
        <p className={`text-sm mb-2 ${th.dangerText}`}>GPS unavailable: {error}</p>
      )}

      <div className="rounded-lg overflow-hidden border" style={{ height: 480, zIndex: 0 }}>
        {typeof window !== "undefined" && (
          <MapContainer
            center={YANGON_CENTER}
            zoom={DEFAULT_ZOOM}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {locations.map((loc) => {
              const active = loc.onActiveTrip;
              const moving = loc.speed > 0;
              const color = active ? "#10b981" : moving ? "#0ea5e9" : "#94a3b8";
              return (
                <CircleMarker
                  key={loc.vehicleId}
                  center={[loc.latitude, loc.longitude]}
                  radius={active ? 9 : 7}
                  pathOptions={{
                    color: "#ffffff",
                    weight: 2,
                    fillColor: color,
                    fillOpacity: active ? 0.9 : 0.7,
                  }}
                >
                  <Tooltip direction="top" offset={[0, -8]} opacity={1}>
                    <div className="text-xs">
                      <strong>{loc.plate}</strong>
                      <br />
                      Speed: {speedLabel(loc.speed)}
                      <br />
                      {active ? "● On active trip" : moving ? "● Moving" : "● Idle"}
                    </div>
                  </Tooltip>
                  <Popup>
                    <div className="text-sm">
                      <strong>Vehicle: {loc.plate}</strong>
                      <br />
                      GPS ID: {loc.gpsDeviceId}
                      <br />
                      Speed: {speedLabel(loc.speed)}
                      <br />
                      Status: {active ? "On active trip" : moving ? "Moving" : "Idle"}
                      <br />
                      Updated: {new Date(loc.timestamp * 1000).toLocaleTimeString()}
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        )}
      </div>

      <p className={`text-xs mt-2 ${th.textMuted}`}>
        Positions streamed every 10s from NetPros GPS (Wialon). Vehicles without a GPS
        unit (1L-5160, 4R-5052) are not shown.
      </p>
    </Card>
  );
}