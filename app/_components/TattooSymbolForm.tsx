"use client";

import { useRef, useState, useEffect } from "react";
import Controls from "./Controls";
import SvgDisplay from "./SvgDisplay";
import DynamicHeader from "./DynamicHeader";

/* ---------------- TYPES ---------------- */
interface ApiResponse {
  svg: string;
}

/**
 * Constructor type for speech recognition.
 * Needed because TypeScript does not know about webkitSpeechRecognition.
 */

/* ---------------- SPEECH RECOGNITION TYPES (INLINE) ---------------- */

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;

  start(): void;
  stop(): void;
  abort(): void;

  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognition, ev: Event) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
}


type SpeechRecognitionConstructor = {
  new (): SpeechRecognition;
};

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export default function TattooSymbolForm() {
  const [text, setText] = useState<string>("");
  const [style, setStyle] = useState<string>("tribal");
  const [svg, setSvg] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscript = useRef<string>("");
  const isStarting = useRef<boolean>(false);

  /* ---------------- INIT SPEECH RECOGNITION ---------------- */
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR(); // TS now knows SR is a constructor
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsRecording(true);
      isStarting.current = false;
      finalTranscript.current = "";
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript.current += transcript + " ";
        } else {
          interim += transcript;
        }
      }
      setText(finalTranscript.current + interim);
    };

    recognition.onerror = () => {
      setIsRecording(false);
      isStarting.current = false;
    };

    recognition.onend = () => {
      setIsRecording(false);
      isStarting.current = false;
      if (finalTranscript.current.trim()) {
        setText(finalTranscript.current.trim());
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, []);

  /* ---------------- RECORDING CONTROLS ---------------- */
  const startRecording = () => {
    const recognition = recognitionRef.current;
    if (!recognition || isRecording || isStarting.current) return;

    try {
      isStarting.current = true;
      finalTranscript.current = "";
      recognition.start();
    } catch (err) {
      console.error("Start failed:", err);
      isStarting.current = false;
    }
  };

  const stopRecording = () => {
    const recognition = recognitionRef.current;
    if (!recognition || !isRecording) return;
    recognition.stop();
  };

  /* ---------------- GENERATE SVG ---------------- */
  const generate = async () => {
    if (!text.trim()) return;
    setLoading(true);

    try {
      const res = await fetch("/api/ultrachaos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, style }),
      });

      const data: ApiResponse = await res.json();
      setSvg(data.svg);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-5 min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-purple-700 to-purple-600 text-white">
      <div className="w-full max-w-6xl mx-auto flex flex-col">
        <DynamicHeader />

        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 p-6 rounded-xl shadow-2xl bg-purple-800/80 border border-purple-600 transition-colors duration-500">
            <Controls
              text={text}
              style={style}
              loading={loading}
              isRecording={isRecording}
              setText={setText}
              setStyle={setStyle}
              generate={generate}
              startRecording={startRecording}
              stopRecording={stopRecording}
            />
          </div>

          <div className="flex-1 p-6 rounded-xl shadow-lg flex items-center justify-center bg-purple-800/80 border border-purple-600 transition-colors duration-500">
            {svg ? (
              <SvgDisplay svg={svg} />
            ) : (
              <p className="opacity-70 text-center">Your tattoo preview will appear here</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
