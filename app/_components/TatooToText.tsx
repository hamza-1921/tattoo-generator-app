"use client";

import { useState, useRef } from "react";
import { Upload, Volume2, Text, Copy, Check, File, X } from "lucide-react";
import DynamicHeader from "./DynamicHeader";

export default function TattooToTextPage() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setText("");
    }
  };

  const convertTattoo = async () => {
    if (!file) return;
    setLoading(true);
    setText("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/tatoo-to-text", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.text) setText(data.text);
    } catch {
      setText("❌ Error converting tattoo.");
    } finally {
      setLoading(false);
    }
  };

  const speakText = () => {
    if ("speechSynthesis" in window && text) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  const copyText = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearAll = () => {
    setFile(null);
    setText("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-gradient-to-br from-purple-900 via-purple-700 to-purple-600 text-white">
      <div className="w-full max-w-6xl flex flex-col">
        <DynamicHeader />

        <div className="flex flex-col md:flex-row gap-6">
          {/* Upload Panel */}
          <div className="flex-1 p-6 rounded-xl bg-purple-800/80 border border-purple-600 transition-colors duration-500">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Upload className="w-5 h-5 text-purple-300" />
              Upload Tattoo
            </h2>

            <label className="block p-6 border-2 border-dashed border-purple-400/40 rounded-lg text-center cursor-pointer hover:border-purple-300 transition">
              <Upload className="mx-auto mb-2 w-6 h-6 text-purple-300" />
              <p className="text-purple-100">Click to upload tattoo</p>
              <p className="text-sm text-purple-300">SVG, PNG, JPG</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".svg,.png,.jpg,.jpeg"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>

            {file && (
              <div className="mt-3 p-3 rounded-lg bg-purple-900/40 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <File className="w-4 h-4 text-purple-300" />
                  <span className="text-sm">{file.name}</span>
                </div>
                <button onClick={clearAll}>
                  <X className="w-4 h-4 text-purple-300 hover:text-white" />
                </button>
              </div>
            )}

            <button
              onClick={convertTattoo}
              disabled={!file || loading}
              className="w-full mt-4 py-3 rounded-lg font-bold bg-indigo-500 hover:bg-indigo-600 transition disabled:opacity-50"
            >
              {loading ? "Converting..." : "Convert to Text"}
            </button>
          </div>

          {/* Result Panel */}
          <div className="flex-1 p-6 rounded-xl bg-purple-800/80 border border-purple-600 transition-colors duration-500">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Text className="w-5 h-5 text-purple-300" />
              Extracted Text
            </h2>

            {text ? (
              <>
                <div className="p-4 rounded-lg bg-purple-900/40 mb-4">
                  <p className="whitespace-pre-wrap text-purple-100">{text}</p>
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={speakText}
                    className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 flex items-center gap-2"
                  >
                    <Volume2 className="w-4 h-4" />
                    Play
                  </button>

                  <button
                    onClick={copyText}
                    className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 flex items-center gap-2"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </>
            ) : (
              <div className="h-40 flex flex-col items-center justify-center text-purple-300">
                <Text className="w-8 h-8 mb-2" />
                No text extracted yet
              </div>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-purple-300 text-sm">
          Convert tattoo designs into meaningful text & audio
        </p>
      </div>
    </div>
  );
}
