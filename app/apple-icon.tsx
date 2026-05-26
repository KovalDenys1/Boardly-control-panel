import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#050706',
          border: '3px solid rgba(0,255,65,0.4)',
        }}
      >
        <span
          style={{
            fontFamily: 'monospace',
            fontSize: 72,
            fontWeight: 700,
            color: '#00ff41',
            lineHeight: 1,
          }}
        >
          $_
        </span>
      </div>
    ),
    { ...size }
  )
}
