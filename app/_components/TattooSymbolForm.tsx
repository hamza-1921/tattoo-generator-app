"use client";

import { useRef, useState, useEffect } from "react";
import Controls from "./Controls";
import SvgDisplay from "./SvgDisplay";
import DynamicHeader from "./DynamicHeader";


export default function TattooSymbolForm() {
  const [text, setText] = useState("");
  const [style, setStyle] = useState("tribal");
  const [svg, setSvg] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Get dark mode from provider
 

  // Track source of text changes
  const isFromAudio = useRef(false);
  const initialRender = useRef(true);

  // AUDIO STATES
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  // Auto-generate ONLY when text comes from audio
  useEffect(() => {
    if (text.trim() && !initialRender.current && isFromAudio.current) {
      generate();
      isFromAudio.current = false;
    }
    initialRender.current = false;
  }, [text]);

  async function generate() {
    if (!text.trim()) return;
    setLoading(true);

    try {
     
      const res = await fetch("/api/ultrachaos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text,style}),
      });
      const data = await res.json();
      setSvg(data.svg);
    } catch (err) {
      console.error("Error generating tattoo:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleTextChange = (newText: string) => {
    setText(newText);
    isFromAudio.current = false;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      audioChunks.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };

      recorder.onstop = handleRecordingStop;

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error("Mic error:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleRecordingStop = async () => {
    const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
    await sendAudioForTranscription(audioBlob);
  };

  const handleAudioFile = async (file: File) => {
    await sendAudioForTranscription(file);
  };

  const sendAudioForTranscription = async (audio: Blob | File) => {
    const formData = new FormData();
    
    if (audio instanceof File) {
      formData.append("file", audio, audio.name);
    } else {
      const mimeType = audio.type || 'audio/webm';
      const extension = getExtensionFromMimeType(mimeType);
      formData.append("file", audio, `recording.${extension}`);
    }
    
    setLoading(true);

    try {
      const res = await fetch("/api/audio-to-text", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.text) {
        isFromAudio.current = true;
        setText(data.text);
      }
    } catch (err) {
      console.error("Transcription error:", err);
    } finally {
      setLoading(false);
    }
  };

  function getExtensionFromMimeType(mimeType: string): string {
    const mimeMap: Record<string, string> = {
      'audio/webm': 'webm',
      'audio/wav': 'wav',
      'audio/x-wav': 'wav',
      'audio/mpeg': 'mp3',
      'audio/mp3': 'mp3',
      'audio/mp4': 'mp4',
      'audio/m4a': 'm4a',
      'audio/ogg': 'ogg',
      'audio/flac': 'flac',
      'audio/aac': 'aac',
      'audio/x-m4a': 'm4a',
      'video/mp4': 'mp4',
      'video/webm': 'webm'
    };
    
    return mimeMap[mimeType.toLowerCase()] || 'webm';
  }

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
              setText={handleTextChange}
              setStyle={setStyle}
              generate={generate}
              startRecording={startRecording}
              stopRecording={stopRecording}
              onAudioFile={handleAudioFile}
            />
          </div>

          <div className={`flex-1 p-6 rounded-xl shadow-lg flex items-center justify-center bg-purple-800/80 border border-purple-600 transition-colors duration-500" }`}
          >
            {svg ? (
              <SvgDisplay svg={svg}  />
            ) : (
              <p className={`opacity-60 text-center ${"text-gray-400" }`}>
                Tattoo preview will appear here.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}