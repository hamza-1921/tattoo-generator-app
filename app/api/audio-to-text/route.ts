import { NextRequest, NextResponse } from "next/server";
import { pipeline } from "@huggingface/transformers";
import fs from "fs";
import os from "os";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import extract from "extract-zip";

const execAsync = promisify(exec);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// --- Helper: check if file is ZIP
function isZipFile(filename: string): boolean {
  return path.extname(filename).toLowerCase() === ".zip";
}

// --- Helper: extract ZIP and find first audio file
async function extractZipFile(zipPath: string): Promise<string> {
  const extractDir = path.join(os.tmpdir(), `extracted-${Date.now()}`);
  await fs.promises.mkdir(extractDir, { recursive: true });
  await extract(zipPath, { dir: extractDir });

  const files = await fs.promises.readdir(extractDir);
  const audioFiles = files.filter(f =>
    ['.wav', '.mp3', '.m4a', '.webm', '.ogg', '.flac', '.aac', '.mp4'].includes(path.extname(f).toLowerCase())
  );

  if (audioFiles.length === 0) throw new Error("No audio files found in ZIP archive");
  return path.join(extractDir, audioFiles[0]);
}

// --- Helper: convert audio to WAV via ffmpeg
async function convertToWav(inputPath: string): Promise<string> {
  const outputPath = path.join(os.tmpdir(), `audio-${Date.now()}.wav`);

  // Check file size first
  const stats = fs.statSync(inputPath);
  if (stats.size === 0) throw new Error("Uploaded file is empty");

  await execAsync(
    `ffmpeg -i "${inputPath}" -ar 16000 -ac 1 -c:a pcm_s16le "${outputPath}" -y`
  );
  return outputPath;
}

// --- Helper: cleanup temp files/directories
async function cleanupTempFiles(...paths: (string | null)[]) {
  for (const filePath of paths) {
    if (filePath && fs.existsSync(filePath)) {
      try {
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          await fs.promises.rm(filePath, { recursive: true, force: true });
        } else {
          await fs.promises.unlink(filePath);
        }
      } catch {
        // ignore cleanup errors
      }
    }
  }
}

// --- Read WAV file to Float32Array
function readAudioFile(wavPath: string): Float32Array {
  const buffer = fs.readFileSync(wavPath);
  const dataView = new DataView(buffer.buffer);

  const riffHeader = String.fromCharCode(buffer[0], buffer[1], buffer[2], buffer[3]);
  const waveHeader = String.fromCharCode(buffer[8], buffer[9], buffer[10], buffer[11]);
  if (riffHeader !== "RIFF" || waveHeader !== "WAVE") throw new Error("Invalid WAV file");

  let offset = 12;
  while (offset < buffer.length - 8) {
    const chunkId = String.fromCharCode(buffer[offset], buffer[offset + 1], buffer[offset + 2], buffer[offset + 3]);
    const chunkSize = dataView.getUint32(offset + 4, true);

    if (chunkId === "data") {
      const dataStart = offset + 8;
      const sampleCount = chunkSize / 2;
      const floatArray = new Float32Array(sampleCount);
      for (let i = 0; i < sampleCount; i++) {
        floatArray[i] = dataView.getInt16(dataStart + i * 2, true) / 32768.0;
      }
      return floatArray;
    }
    offset += 8 + chunkSize;
  }
  throw new Error("Could not find audio data in WAV file");
}

// --- POST Handler
export async function POST(request: NextRequest): Promise<NextResponse> {
  let inputPath: string | null = null;
  let wavPath: string | null = null;
  let extractedDir: string | null = null;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    // Save uploaded file
    const tempDir = os.tmpdir();
    const fileExt = path.extname(file.name) || ".webm";
    inputPath = path.join(tempDir, `upload-${Date.now()}${fileExt}`);

    const arrayBuffer = await file.arrayBuffer();
    fs.writeFileSync(inputPath, Buffer.from(arrayBuffer));

    // --- Empty file check
    if (fs.statSync(inputPath).size === 0) {
      await cleanupTempFiles(inputPath);
      return NextResponse.json({ error: "Uploaded file is empty" }, { status: 400 });
    }

    // --- Handle ZIP
    let audioFilePath = inputPath;
    if (isZipFile(file.name)) {
      extractedDir = path.join(tempDir, `extracted-${Date.now()}`);
      audioFilePath = await extractZipFile(inputPath);
    }

    // --- Convert to WAV
    wavPath = await convertToWav(audioFilePath);

    // --- Load Whisper model & transcribe
    const transcriber = await pipeline("automatic-speech-recognition", "Xenova/whisper-tiny", { device: "cpu" });
    const audioData = readAudioFile(wavPath);
    const result = await transcriber(audioData, { language: "en", task: "transcribe", chunk_length_s: 30, stride_length_s: 5, return_timestamps: false });
    const text = Array.isArray(result) ? result.map(r => r.text).join(" ").trim() : result.text.trim();

    await cleanupTempFiles(inputPath, wavPath, extractedDir);

    return NextResponse.json({
      success: true,
      text,
      method: "pipeline",
      extractedFromZip: isZipFile(file.name),
      timestamp: new Date().toISOString(),
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    await cleanupTempFiles(inputPath, wavPath, extractedDir);
    return NextResponse.json({ error: "Transcription failed", message: errorMessage, timestamp: new Date().toISOString() }, { status: 500 });
  }
}

// --- GET Handler
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: "ready",
    instructions: "POST audio file to /api/audio-to-text",
    note: "Supports WAV, WebM, MP3, ZIP archives, and other audio formats",
    timestamp: new Date().toISOString(),
  });
}

// --- PUT & DELETE
export async function PUT(): Promise<NextResponse> {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
export async function DELETE(): Promise<NextResponse> {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
