"use client";


import { useState } from "react";


interface ControlsProps {
  text: string;
  style: string;
  loading: boolean;
  isRecording: boolean;
  setText: (v: string) => void;
  setStyle: (v: string) => void;
  generate: () => void;
  startRecording: () => void;
  stopRecording: () => void;
}

export default function Controls({
  text,
  style,
  loading,
  isRecording,
  setText,
  setStyle,
  generate,
  startRecording,
  stopRecording,
}: ControlsProps) {



  const [uploading, setUploading] = useState(false);

  const busy = loading || uploading;

  /* ---------------- FILE UPLOAD ---------------- */
  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("audio", file, "recording.webm");

      const response = await fetch("/api/audio-to-text", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Failed to transcribe");

      setText(data.text);

      const audio = new Audio(URL.createObjectURL(file));
      audio.play();
    } catch (err: unknown) {
      if (err instanceof Error) alert(`Error: ${err.message}`);
      else alert("An unexpected error occurred");
    } finally {
      setUploading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") generate();
  };

  return (
    <>
      <p className="mb-4 text-gray-300 text-sm">
        Enter text, speak, or upload an audio file.
      </p>

      {/* TEXT INPUT */}
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyPress}
        disabled={busy}
        placeholder="Enter text..."
        className="w-full px-3 py-2 mb-3 rounded-lg border border-gray-600 bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-300"
      />

      {/* STYLE SELECT */}
      <select
        value={style}
        onChange={(e) => setStyle(e.target.value)}
        className="w-full px-3 py-2 mb-3 rounded-lg border border-gray-600 bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-300"
      >
        {[
          "tribal","geometric","minimalist","traditional","neotraditional",
          "japanese","blackwork","dotwork","mandala","script","biomech",
          "chaos","ultrachaos"
        ].map((s) => (
          <option key={s} value={s}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </option>
        ))}
      </select>

      {/* AUDIO CONTROLS */}
      <div className="flex gap-2 mb-3">
        {/* Voice Recording */}
        {!isRecording ? (
          <button
            onClick={startRecording}
            disabled={busy}
            className="flex-1 py-1 text-sm bg-green-600 hover:bg-green-500 text-white rounded-lg"
          >
            🎤 Start
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="flex-1 py-1 text-sm bg-red-600 hover:bg-red-500 text-white rounded-lg"
          >
            ⏹ Stop
          </button>
        )}

        {/* Upload Audio File */}
        <label className="flex-1 py-1 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center justify-center cursor-pointer">
          📁 Upload
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileInput}
            className="hidden"
            disabled={busy}
          />
        </label>
      </div>

      {/* GENERATE BUTTON */}
      <button
        onClick={generate}
        disabled={busy}
        className={`w-full py-2 text-sm font-bold rounded-lg mb-3 transition-colors duration-300 ${
          busy ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {busy ? "Processing..." : "Generate Tattoo"}
      </button>
    </>
  );
}

