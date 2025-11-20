"use client";

import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { sdk } from "@farcaster/miniapp-sdk";
import { createClient } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Eski MoodCaster constants.js'den alınmış tüm emojiler (50+ tane)
const moods = [
  "🤩", "😍", "🥰", "😘", "😊", "🙂", "🤗", "🤔", "😐", "😑",
  "🙄", "😏", "😣", "😥", "😮", "🤐", "😯", "😪", "😫", "🥱",
  "😴", "😌", "😛", "😜", "😝", "🤤", "😒", "😓", "😔", "😕",
  "🙃", "🤑", "😲", "☹️", "🙁", "😖", "😞", "😟", "😤", "😢",
  "😭", "😦", "😧", "😨", "😩", "🤯", "😬", "😰", "😱", "🥵",
  "🥶", "😳", "🤪", "😵", "🥴", "😠", "😡", "🤬", "😷", "🤒",
  "🤕", "🤢", "🤮", "🤧", "😇", "🥺", "🤠", "🥳", "😎", "🤓",
  "🧐", "😋", "😚", "😙", "🥲", "😈", "👿", "💀", "☠️", "👻",
  "👽", "🤖", "💩", "😺", "😸", "😹", "😻", "😼", "😽", "🙀",
  "😿", "😾", "🙈", "🙉", "🙊", "❤️", "💔", "❣️", "💕", "💞",
  "💓", "💗", "💖", "💘", "💝", "💟", "☮️", "✝️", "☪️", "🕉",
  "☸️", "✡️", "🔯", "🕎", "☯️", "🆔", "⚛️", "🀄", "♒", "♋"
];

export default function Home() {
  const { ready, authenticated, user, login } = usePrivy();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [todayPosted, setTodayPosted] = useState(false);

  useEffect(() => {
    if (sdk.status === "ready") {
      sdk.actions.ready();
    }
  }, []);

  useEffect(() => {
    if (authenticated && user?.farcaster?.fid) {
      getLocation();
      checkTodayPost();
    }
  }, [authenticated, user]);

  const fid = user?.farcaster?.fid;
  const username = user?.farcaster?.username || "anon";

  const getLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => alert("Location permission needed!"),
      { enableHighAccuracy: true }
    );
  };

  const checkTodayPost = async () => {
    if (!fid) return;
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("moods")
      .select("id")
      .eq("fid", fid)
      .eq("date", today);
    if (data?.length) setTodayPosted(true);
  };

  const submitMood = async () => {
    if (!selectedMood || !location || !fid || todayPosted) return;
    setLoading(true);

    await supabase.from("moods").insert({
      fid,
      mood: selectedMood,
      note: note.slice(0, 24),
      lat: location.lat,
      lng: location.lng,
      username,
      date: new Date().toISOString().split("T")[0],
    });

    setLoading(false);
    alert("Mood added to the map! 🌍");
    window.location.href = "/map";
  };

  if (!ready || !authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f23]">
        <button onClick={login} className="bg-purple-600 hover:bg-purple-700 px-8 py-4 rounded-full text-xl font-bold">
          Sign in with Farcaster
        </button>
      </div>
    );
  }

  if (todayPosted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-[#0f0f23] p-6">
        <p className="text-2xl">You've already shared your mood today!</p>
        <a href="/map" className="bg-purple-600 px-8 py-4 rounded-full text-xl font-bold">
          View Map
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f23] p-6 flex flex-col">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          How is your mood today?
        </h1>
        <p className="text-gray-400 mt-2">
          📍 Location: {location ? "Detected" : "Waiting..."}
        </p>
      </div>

      {/* Eski tasarıma sadık, ferah grid */}
      <div className="grid grid-cols-6 gap-4 mb-8 max-h-[60vh] overflow-y-auto px-4">
        {moods.map((emoji, i) => (
          <button
            key={i}
            onClick={() => setSelectedMood(emoji)}
            className={`aspect-square rounded-2xl flex items-center justify-center text-5xl transition-all ${
              selectedMood === emoji
                ? "ring-4 ring-purple-500 scale-110 shadow-2xl bg-purple-900"
                : "bg-gray-800 hover:bg-gray-700 hover:scale-105"
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>

      <input
        type="text"
        maxLength={24}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Write a short status (Optional)"
        className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-2"
      />
      <div className="text-right text-gray-500 text-sm mb-4">{note.length}/24</div>

      <button
        onClick={submitMood}
        disabled={!selectedMood || !location || loading}
        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 py-5 rounded-full text-xl font-bold flex items-center justify-center gap-3"
      >
        {loading ? <Loader2 className="animate-spin" /> : "Add to Map 🚀"}
      </button>
    </div>
  );
}