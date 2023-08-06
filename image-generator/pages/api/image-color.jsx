import { ImageResponse } from "@vercel/og"

export const config = {
  runtime: "edge",
}

export default function handler(
  /**
   * @type {import('next/server').NextRequest}
   */
  req
) {
  return new ImageResponse(
    (
      // used for the theme colors
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: req.nextUrl.searchParams?.get("color"),
        }}
      />
    ),
    {
      height: 15,
      width: 15,
    }
  )
}
