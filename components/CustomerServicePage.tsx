'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { policyDocuments, markdownToHtml, PolicyDocument } from '@/lib/policies'

interface LoadedDocument extends PolicyDocument {
  content: string
}

export default function CustomerServicePage() {
  const searchParams = useSearchParams()
  const [documents, setDocuments] = useState<LoadedDocument[]>([])
  const [selectedDocument, setSelectedDocument] = useState<LoadedDocument | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load all policy documents
  useEffect(() => {
    const loadDocuments = async () => {
      setIsLoading(true)
      const loadedDocs: LoadedDocument[] = []
      
      for (const doc of policyDocuments) {
        try {
          const response = await fetch(`/policies/${doc.filename}`)
          if (response.ok) {
            const markdown = await response.text()
            const htmlContent = markdownToHtml(markdown)
            loadedDocs.push({
              ...doc,
              content: htmlContent
            })
          }
        } catch (error) {
          console.error(`Error loading ${doc.filename}:`, error)
          // Add fallback content
          loadedDocs.push({
            ...doc,
            content: `<h2>${doc.title}</h2><p>Content is being updated. Please check back soon or contact us at info@squarage.com for assistance.</p>`
          })
        }
      }
      
      setDocuments(loadedDocs)
      
      // Check for URL parameter to select specific document
      const docParam = searchParams.get('doc')
      if (docParam && loadedDocs.length > 0) {
        const targetDoc = loadedDocs.find(doc => doc.id === docParam)
        if (targetDoc) {
          setSelectedDocument(targetDoc)
        } else {
          setSelectedDocument(loadedDocs[0])
        }
      } else if (loadedDocs.length > 0) {
        setSelectedDocument(loadedDocs[0])
      }
      
      setIsLoading(false)
    }
    
    loadDocuments()
  }, [searchParams])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream pt-24 md:pt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <h1 className="text-4xl md:text-5xl font-black font-neue-haas text-squarage-black mb-2">
            Customer Service
          </h1>
          <p className="text-gray-500 font-neue-haas mb-8 md:mb-12">Loading policies...</p>
        </div>
      </div>
    )
  }

  if (!selectedDocument) {
    return null
  }

  return (
    <div className="min-h-screen bg-cream pt-24 md:pt-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <h1 className="text-4xl md:text-5xl font-black font-neue-haas text-squarage-black mb-2">
          Customer Service
        </h1>
        <p className="text-gray-500 font-neue-haas mb-8 md:mb-12">Policies & Information</p>

        {/* Mobile Dropdown */}
        <div className="md:hidden mb-8">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-full flex items-center justify-between px-6 py-4 bg-white/50 rounded-xl hover:bg-white/70 transition-all"
          >
            <span className="font-neue-haas text-lg font-medium">{selectedDocument.title}</span>
            <ChevronDownIcon 
              className={`w-5 h-5 transition-transform text-gray-400 ${isMobileMenuOpen ? 'rotate-180' : ''}`}
            />
          </button>
          
          {/* Dropdown Menu */}
          {isMobileMenuOpen && (
            <div className="mt-2 bg-cream rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              {documents.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => {
                    setSelectedDocument(doc)
                    setIsMobileMenuOpen(false)
                  }}
                  className={`w-full text-left px-6 py-4 font-neue-haas hover:bg-white/50 transition-all ${
                    doc.id === selectedDocument.id ? 'bg-squarage-yellow/10 text-squarage-orange font-medium' : ''
                  }`}
                >
                  {doc.title}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex gap-12">
          {/* Sidebar */}
          <div className="w-72 flex-shrink-0">
            <nav className="sticky top-32 space-y-1">
              {documents.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDocument(doc)}
                  className={`w-full text-left px-6 py-3 font-neue-haas rounded-lg transition-all duration-200 ${
                    doc.id === selectedDocument.id
                      ? 'bg-gradient-to-r from-squarage-yellow to-squarage-orange text-white font-medium shadow-lg transform scale-105'
                      : 'hover:bg-white/50 text-gray-700'
                  }`}
                >
                  {doc.title}
                </button>
              ))}
            </nav>
          </div>

          {/* Document Content - Desktop */}
          <div className="flex-1 max-w-4xl">
            <div className="bg-cream rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
              <div 
                className="prose prose-lg max-w-none font-neue-haas"
                dangerouslySetInnerHTML={{ __html: selectedDocument.content }}
              />
            </div>
          </div>
        </div>

        {/* Document Content - Mobile */}
        <div className="md:hidden">
          <div className="bg-cream rounded-2xl shadow-sm border border-gray-100 p-6">
            <div 
              className="prose prose-sm max-w-none font-neue-haas"
              dangerouslySetInnerHTML={{ __html: selectedDocument.content }}
            />
          </div>
        </div>
      </div>

      {/* Styles for prose content */}
      <style jsx global>{`
        .prose h2 {
          font-family: 'Neue Haas Grotesk', sans-serif;
          font-weight: 800;
          font-size: 2rem;
          margin-bottom: 1.5rem;
          color: #000;
          letter-spacing: -0.02em;
        }
        .prose h3 {
          font-family: 'Neue Haas Grotesk', sans-serif;
          font-weight: 600;
          font-size: 1.25rem;
          margin-top: 2rem;
          margin-bottom: 1rem;
          color: #333;
          letter-spacing: -0.01em;
        }
        .prose p {
          font-family: 'Neue Haas Grotesk', sans-serif;
          margin-bottom: 1.25rem;
          line-height: 1.7;
          color: #555;
        }
        .prose ul {
          font-family: 'Neue Haas Grotesk', sans-serif;
          margin-bottom: 1.25rem;
          padding-left: 1.5rem;
          color: #555;
          list-style-type: disc;
          list-style-position: outside;
        }
        .prose ol {
          font-family: 'Neue Haas Grotesk', sans-serif;
          margin-bottom: 1.25rem;
          padding-left: 1.5rem;
          color: #555;
          list-style-type: decimal;
          list-style-position: outside;
        }
        .prose li {
          margin-bottom: 0.75rem;
          line-height: 1.7;
          display: list-item;
        }
        .prose strong {
          font-weight: 600;
          color: #000;
        }
        .prose ul li::marker {
          color: #ff962d;
        }
        .prose ol li::marker {
          color: #ff962d;
          font-weight: 600;
        }
        .prose code {
          font-family: monospace;
          background: rgba(0,0,0,0.05);
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-size: 0.875em;
        }
      `}</style>
    </div>
  )
}