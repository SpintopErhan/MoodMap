"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@supabase/supabase-js";
import { sdk } from "@farcaster/miniapp-sdk";

// Tüm Leaflet bileşenlerini dynamic + ssr: false
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false });
const useMap = dynamic(() => import("react-leaflet").then((mod) => mod.useMap), { ssr: false });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Mood = {
  id: number;
  mood: string;
  note: string | null;
  lat: number;
  lng: number;
  username: string;
};

export default function MapPage() {
  const [moods, setMoods] = useState<Mood[]>([]);
  const [leafletReady, setLeafletReady] = useState(false);

  // Leaflet CSS'i ve L'yi sadece client-side yükle
  useEffect(() => {
    const loadLeaflet = async () => {
      await import("leaflet/dist/leaflet.css");
      const L = await import("leaflet");
      // Leaflet icon fix
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });
      (window as any).L = L;
      setLeafletReady(true);
    };
    loadLeaflet();
  }, []);

  useEffect(() => {
    if (sdk.status === "ready") sdk.actions.ready();
    fetchMoods();
  }, []);

  const fetchMoods = async () => {
    const { data } = await supabase.from("moods").select("*");
    setMoods(data || []);
  };

  // Gruplama
  const groups: Record<string, Mood[]> = {};
  moods.forEach((m) => {
    const key = `${m.lat.toFixed(3)}-${m.lng.toFixed(3)}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(m);
  });

  if (!leafletReady) {
    return (
      <div className="h-screen bg-black flex items-center justify-center text-white text-2xl">
        Loading map...
      </div>
    );
  }

  const L = (window as any).L;

    const createMarkerIcon = (mainEmoji: string, count: number) => {
    if (count === 1) {
      return L.divIcon({
        html: `<div style="font-size: 50px; filter: drop-shadow(0 0 15px rgba(0,0,0,0.9)); text-shadow: 0 0 10px #a855f7;">${mainEmoji}</div>`,
        className: "",
        iconSize: [50, 50],
        iconAnchor: [25, 50],
      });
    }

    // Birden fazla mood varsa → emoji + mor glow'lu badge
        return L.divIcon({
      html: `
        <div style="position: relative;">
          <div style="font-size: 52px; filter: drop-shadow(0 0 15px black);">${mainEmoji || "😶"}</div>
          <div style="position: absolute; top: -18px; right: -22px; background:#a855f7; color:white; font-weight:bold; font-size:20px; width:44px; height:44px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:5px solid #000; box-shadow: 0 0 25px #a855f7; animation: glow 2s infinite alternate;">
            ${count}
          </div>
        </div>
        <style>
          @keyframes glow {
            from { box-shadow: 0 0 25px #a855f7; }
            to { box-shadow: 0 0 40px #a855f7, 0 0 60px rgba(168,85,247,0.8); }
          }
        </style>
      `,
      className: "",
      iconSize: [80, 80],
      iconAnchor: [40, 70],
    });
  };

 const LockMap = () => {
  const map = useMap();

  useEffect(() => {
    // map hazır olana kadar bekle (kesin çözüm)
    const interval = setInterval(() => {
      if (map && typeof map.setView === "function") {
        map.setView([20, 0], 2);
        map.dragging.disable();
        map.touchZoom.disable();
        map.doubleClickZoom.disable();
        map.scrollWheelZoom.disable();
        map.boxZoom.disable();
        map.keyboard.disable();
        if (map.tap) map.tap.disable();
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [map]);

  return null;
};

  return (
    <div className="h-screen w-full relative bg-black">
      <MapContainer
        center={[20, 0]}
        zoom={2}
        minZoom={2}
        maxZoom={2}
        style={{ height: "100%", width: "100%" }}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution="© Carto"
        />
        <LockMap />

        {Object.values(groups).map((group) => {
          const first = group[0];
          const mainEmoji = group[0].mood;
          const count = group.length;

          return (
            <Marker
              key={`${first.lat}-${first.lng}`}
              position={[first.lat, first.lng]}
              icon={createMarkerIcon(mainEmoji, count)}
            >
                           <Popup className="border-0">
                <div className="bg-[#0f0f23] p-6 rounded-3xl shadow-2xl border border-purple-600">
                  {count > 1 && (
                    <div className="text-center text-purple-400 font-bold mb-4 text-xl">
                      {count} moods here
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-5">
                    {group.map((m, i) => (
                      <div key={i} className="text-center bg-gray-900/70 backdrop-blur-lg rounded-3xl p-5 border-2 border-purple-500/50 shadow-2xl hover:scale-105 transition-all">
                        <div className="text-7xl mb-3">{m.mood}</div>
                        <div className="font-bold text-purple-400">@{m.username || "anon"}</div>
                        {m.note && (
                          <div className="text-xs text-gray-300 italic mt-3 px-2">
                            "{m.mood}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

            {/* Refresh Butonu */}
      <button 
        onClick={fetchMoods} 
        className="absolute top-4 right-4 z-10 bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-full font-bold shadow-2xl flex items-center gap-2"
      >
        <span className="text-xl">🔄</span> Refresh
      </button>

      {/* Update Status Butonu – GÖRÜNÜR VE BÜYÜK! */}
      <button 
        onClick={() => window.location.href = "/"} 
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-10 py-5 rounded-full font-bold text-xl shadow-2xl flex items-center gap-3 animate-pulse"
      >
        <span className="text-3xl">😎</span> Update Status
      </button>
    </div>
  );
}