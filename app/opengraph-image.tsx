import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'ZenZebra - Curated Lifestyle'
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'black',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          position: 'relative',
        }}
      >
        {/* Background gradient effect */}
        <div
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'radial-gradient(circle at 50% 10%, #CC2224 0%, transparent 40%)',
                opacity: 0.2,
            }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 }}>
            <div style={{ fontSize: 80, fontWeight: 900, marginBottom: 20, color: 'white' }}>
                ZenZebra
            </div>
            
            <div style={{ fontSize: 32, color: '#e5e5e5', maxWidth: 800, textAlign: 'center', fontWeight: 300 }}>
                Curated lifestyle, seamlessly integrated into your daily life.
            </div>

            <div style={{ 
                marginTop: 40, 
                background: '#CC2224', 
                color: 'white', 
                padding: '10px 30px', 
                borderRadius: 50, 
                fontSize: 24,
                fontWeight: 600
            }}>
                Try First. Own After.
            </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
