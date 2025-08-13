'use client'

import Image from 'next/image'

export function FlowFiIcon({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <div
      className={`${className} flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 shadow-sm ring-1 ring-black/5 p-[5px]`}
      aria-label="FlowFi logo"
    >
      <div className="bg-white rounded-lg flex items-center justify-center w-full h-full">
        <Image
          src="/favicon.ico"
          alt="FlowFi"
          width={32}
          height={32}
          className="w-8 h-8"
          priority
          unoptimized
        />
      </div>
    </div>
  )
}