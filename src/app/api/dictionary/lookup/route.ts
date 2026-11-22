import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import path from "path";
import util from "util";

const execFilePromise = util.promisify(execFile);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const word = searchParams.get("word")?.trim();

    if (!word) {
      return NextResponse.json({ error: "Word is required" }, { status: 400 });
    }

    const scriptPath = path.join(process.cwd(), "scripts/lookup_word.py");
    const { stdout } = await execFilePromise("python3", [scriptPath, word]);

    const result = JSON.parse(stdout);
    return NextResponse.json({ success: true, lookup: result });
  } catch (error: any) {
    console.error("Lookup error:", error);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
