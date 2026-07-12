import { NextResponse, type NextRequest } from "next/server"

import { BackendRoute } from "@/constants"
import { BackendRequestError, backendFetch } from "@/lib/backend"
import type { PlatformConfigResponse } from "@/modules/settings/types/settings-types"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const application = searchParams.get("application") || "admin"

  try {
    const config = await backendFetch<PlatformConfigResponse>(
      `${BackendRoute.PlatformConfig}?application=${application}`,
    )
    return NextResponse.json({ data: config })
  } catch (error) {
    if (error instanceof BackendRequestError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      )
    }
    return NextResponse.json(
      { message: "Could not reach the backend. Is it running?" },
      { status: 502 },
    )
  }
}
