import { NextResponse } from "next/server"

import { BackendRoute } from "@/constants"
import { BackendRequestError, backendFetch } from "@/lib/backend"
import type { AllSettings } from "@/modules/settings/types/settings-types"

export async function GET() {
  try {
    const settings = await backendFetch<AllSettings>(BackendRoute.AdminSettings)
    return NextResponse.json({ data: settings })
  } catch (error) {
    if (error instanceof BackendRequestError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status }
      )
    }
    return NextResponse.json(
      { message: "Could not reach the backend. Is it running?" },
      { status: 502 }
    )
  }
}
