import { NextResponse } from "next/server";
import Groq from "groq-sdk";

export const runtime = "nodejs";

const groq = new Groq({
  apiKey: process.env.G_KEY, // Get yours at console.groq.com
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("audio") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No audio file found" }, { status: 400 });
    }

    // Groq's Whisper v3 Turbo is compatible with: 
    // mp3, mp4, mpeg, mpga, m4a, wav, webm, flac, ogg
    const transcription = await groq.audio.transcriptions.create({
      file: file,
      model: "whisper-large-v3-turbo", 
      response_format: "json",
      // language: "en", // Optional: hardcode to 'en' for slightly faster speed
    });

    return NextResponse.json({ text: transcription.text });
  } catch (err: unknown) {
    if (err instanceof Error) {
        console.error("Transcription Error:", err.message);
        return NextResponse.json(
            { error: "Failed to transcribe", details: err.message },
            { status: 500 }
        );
    }
  }
}