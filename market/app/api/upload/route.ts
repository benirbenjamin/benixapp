import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { uploadFile } from "@/lib/storage";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const result = await uploadFile(file, file.name);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Upload route error:", error);
    return NextResponse.json({ error: "File upload failed" }, { status: 500 });
  }
}
