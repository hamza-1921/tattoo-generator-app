"use client";

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
  onAudioFile: (file: File) => void;
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
  onAudioFile,
}: ControlsProps) {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") generate();
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      onAudioFile(e.target.files[0]);
    }
  };

  return (
    <>
      <p className="mb-4 text-gray-600 dark:text-gray-300">
        Enter text, speak, or upload an audio file.
      </p>

      {/* TEXT INPUT */}
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyPress}
        disabled={loading}
        placeholder="Enter text..."
        className={`w-full px-4 py-3 mb-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-300
          ""border-gray-700 bg-gray-700 text-gray-100" "}
         
        `}
      />

      {/* STYLE SELECT */}
      <select
        value={style}
        onChange={(e) => setStyle(e.target.value)}
        className={`w-full px-4 py-3 mb-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-300
         }
        `}
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
      <div className="flex gap-2 mb-4">
        {!isRecording ? (
          <button
            onClick={startRecording}
            disabled={loading}
            className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg"
          >
            🎤 Start Recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg"
          >
            ⏹ Stop Recording
          </button>
        )}

        <label className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center justify-center cursor-pointer">
          📁 Upload Audio
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileInput}
            className="hidden"
          disabled={loading}
          />
        </label>
      </div>

      {/* GENERATE BUTTON */}
      <button
        onClick={generate}
        disabled={loading}
        className={`w-full py-3 font-bold rounded-lg mb-4 transition-colors duration-300
          
          ${loading ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        {loading ? "Processing..." : "Generate Tattoo"}
      </button>
    </>
  );
}
