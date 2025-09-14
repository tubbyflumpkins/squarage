// Policy document configuration
export interface PolicyDocument {
  id: string
  title: string
  filename: string
}

export const policyDocuments: PolicyDocument[] = [
  {
    id: 'return-policy',
    title: 'Return Policy',
    filename: 'return-policy.md'
  },
  {
    id: 'warranty-policy',
    title: 'Warranty Details',
    filename: 'warranty-policy.md'
  },
  {
    id: 'shipping-policy',
    title: 'Shipping Policy',
    filename: 'shipping-policy.md'
  },
  {
    id: 'privacy-policy',
    title: 'Privacy Policy',
    filename: 'privacy-policy.md'
  },
  {
    id: 'terms-conditions',
    title: 'Terms & Conditions',
    filename: 'terms-conditions.md'
  }
]

// Convert markdown to HTML
export function markdownToHtml(markdown: string): string {
  // Convert headers first
  let html = markdown
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h3>$1</h3>')
    .replace(/^# (.*$)/gim, '<h2>$1</h2>')
    
  // Convert bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  
  // Process lines for lists and paragraphs
  const lines = html.split('\n')
  let inList = false
  const processedLines: string[] = []
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmedLine = line.trim()
    
    // Check if this is a list item
    if (trimmedLine.startsWith('- ')) {
      if (!inList) {
        processedLines.push('<ul>')
        inList = true
      }
      // Process the list item content (handle bold within list items)
      const listContent = trimmedLine.substring(2)
      processedLines.push(`<li>${listContent}</li>`)
    } 
    // Check if we need to close the list (non-empty line that's not a list item)
    else if (inList && trimmedLine && !trimmedLine.startsWith('- ')) {
      processedLines.push('</ul>')
      inList = false
      
      // Process the current line
      if (!trimmedLine.includes('<h') && !trimmedLine.includes('<ul') && !trimmedLine.includes('</ul')) {
        processedLines.push(`<p>${line}</p>`)
      } else {
        processedLines.push(line)
      }
    }
    // Handle empty lines (don't close list for empty lines between list items)
    else if (!trimmedLine) {
      // Skip empty lines when in a list
      if (!inList) {
        processedLines.push('')
      }
    }
    // Regular content
    else if (trimmedLine) {
      if (!trimmedLine.includes('<h') && !trimmedLine.includes('<ul') && !trimmedLine.includes('</ul')) {
        processedLines.push(`<p>${line}</p>`)
      } else {
        processedLines.push(line)
      }
    }
  }
  
  // Close any open list at the end
  if (inList) {
    processedLines.push('</ul>')
  }
  
  return processedLines.join('\n')
}