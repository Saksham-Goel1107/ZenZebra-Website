'use client'

import { useState } from 'react'


const LOCATIONS = [
  { label: 'Smartworks - Gurugram', file: 'zenzebra-smartworks.pdf' },
  { label: 'Awfis - Ambience Mall, Gurugram', file: 'zenzebra-awfis.pdf' },
  { label: 'The Lodhi - New delhi', file: 'zenzebra-lodhi.pdf' },
]

export default function CataloguePage() {
  const [selected, setSelected] = useState('')
  const url = selected ? '/catalogs/' + selected : ''

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 py-20">
      {/* Heading */}
      <div className="text-center max-w-2xl mb-10">
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">
          Explore Our <span className="text-[#CC2224]">Catalogue</span>
        </h1>
        <p className="text-white/70 text-lg leading-relaxed">
          Choose your ZenZebra location below to browse the latest handpicked products and experiences curated for that space.
        </p>
      </div>

      {/* Selector */}
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-12">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="rounded-lg bg-white/5 border border-white/10 px-5 py-3 w-64 sm:w-80 text-white text-base
                     focus:outline-none focus:ring-2 focus:ring-[#CC2224] backdrop-blur-lg"
        >
          <option value="">— Select Location —</option>
          {LOCATIONS.map((loc, index) => (
            <option key={index} value={loc.file} className="text-black">
              {loc.label}
            </option>
          ))}
        </select>

        <button
          disabled={!url}
          onClick={() => url && window.open(url, '_blank', 'noopener')}
          className="rounded-lg bg-[#CC2224] disabled:bg-[#CC2224]/40 px-8 py-3 text-lg font-semibold tracking-wide
                     hover:scale-105 transition-transform duration-300 ease-out"
        >
          Open
        </button>
      </div>

      {/* PDF Preview */}
      <div className="w-full max-w-5xl rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03] shadow-lg backdrop-blur-xl transition-all duration-500">
        {url ? (
          <iframe
            key={url}
            src={`${url}#view=FitH`}
            className="w-full h-[70vh] bg-black"
            title="Catalogue preview"
          />
        ) : (
          <div className="h-[50vh] flex items-center justify-center text-white/60 text-lg font-medium tracking-wide">
            Select a location to preview its catalogue.
          </div>
        )}
      </div>
    </main>
  )
}