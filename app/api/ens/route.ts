import { NextResponse } from "next/server";
import { publicClient } from "@/providers/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json({ name: null }, { status: 400 });
  }
  try {
    const name = await publicClient.getEnsName({
      address: address as `0x${string}`,
    });
    return NextResponse.json({ name });
  } catch {
    return NextResponse.json({ name: null });
  }
}
