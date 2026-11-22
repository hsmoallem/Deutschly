import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import util from "util";

const execFilePromise = util.promisify(execFile);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const text = searchParams.get("text")?.trim();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Normalize text and generate stable SHA-256 hash
    const normalized = text.toLowerCase().replace(/\s+/g, " ");
    const hash = crypto.createHash("sha256").update(`${normalized}_de_v1`).digest("hex");
    
    const audioDir = path.join(process.cwd(), "public/audio_cache");
    const filePath = path.join(audioDir, `${hash}.mp3`);

    if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
      fs.mkdirSync(audioDir, { recursive: true });
      const scriptPath = path.join(process.cwd(), "scripts/generate_audio.py");
      await execFilePromise("python3", [scriptPath, text, filePath]);
    }

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Failed to generate audio" }, { status: 500 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: any) {
    console.error("Audio generation error:", error);
    return NextResponse.json({ error: "Audio processing failed" }, { status: 500 });
  }
}
