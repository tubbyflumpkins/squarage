'use client'

import { useState, useEffect } from 'react'
import CustomProjectSectionOriginal from './CustomProjectSectionOriginal'
import CustomProjectSectionV1 from './CustomProjectSectionV1'
import CustomProjectSectionV2 from './CustomProjectSectionV2'
import CustomProjectSectionV3 from './CustomProjectSectionV3'

export default function CustomProjectSection() {
  const [version, setVersion] = useState<'original' | 'v1' | 'v2' | 'v3'>('original')
  const [isOpen, setIsOpen] = useState(false)

  // Load saved version from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedVersion = localStorage.getItem('customProjectVersion') as 'original' | 'v1' | 'v2' | 'v3' | null
      if (savedVersion && ['original', 'v1', 'v2', 'v3'].includes(savedVersion)) {
        setVersion(savedVersion)
      }
    }
  }, [])

  // Save version to localStorage when it changes
  const handleVersionChange = (newVersion: 'original' | 'v1' | 'v2' | 'v3') => {
    setVersion(newVersion)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('customProjectVersion', newVersion)
      } catch (e) {
        console.error('Failed to save version preference:', e)
      }
    }
    setIsOpen(false)
  }

  const versionInfo = {
    original: { name: 'Original', description: 'Blue bg, centered layout' },
    v1: { name: 'Minimalist', description: 'Black bg, side-by-side' },
    v2: { name: 'Gradient Bold', description: 'Colorful gradient bg' },
    v3: { name: 'Offset Border', description: 'Green with border effect' },
  }

  return (
    <>
      {/* Version Switcher - Fixed position */}
      <div className="fixed bottom-20 right-4 z-50">
        {/* Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-purple-600 text-white px-3 py-2 rounded-full shadow-lg hover:bg-purple-700 transition-colors duration-200 flex items-center space-x-2 text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          <span className="font-semibold">Custom: {version.toUpperCase()}</span>
        </button>

        {/* Version Options - Appears above button when open */}
        {isOpen && (
          <div className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-xl p-4 min-w-[250px]">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Custom Section Layout:</h3>
            <div className="space-y-2">
              {Object.entries(versionInfo).map(([key, info]) => (
                <button
                  key={key}
                  onClick={() => handleVersionChange(key as 'original' | 'v1' | 'v2' | 'v3')}
                  className={`w-full text-left p-3 rounded-lg transition-colors duration-200 ${
                    version === key 
                      ? 'bg-purple-100 text-purple-900 border-2 border-purple-400' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{info.name}</div>
                      <div className="text-xs opacity-70">{info.description}</div>
                    </div>
                    {version === key && (
                      <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500">Testing Custom Section</p>
              <button
                onClick={() => {
                  localStorage.removeItem('customProjectVersion')
                  setVersion('original')
                  window.location.reload()
                }}
                className="text-xs text-blue-600 hover:underline mt-1"
              >
                Reset to default
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Render selected version */}
      {version === 'original' && <CustomProjectSectionOriginal />}
      {version === 'v1' && <CustomProjectSectionV1 />}
      {version === 'v2' && <CustomProjectSectionV2 />}
      {version === 'v3' && <CustomProjectSectionV3 />}
    </>
  )
}