'use client'

import { useState, useMemo, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// Contact form validation schema
const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  email: z.string().email('Please enter a valid email address').max(255, 'Email is too long'),
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(200, 'Subject is too long'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000, 'Message is too long'),
})

type ContactFormData = z.infer<typeof contactSchema>

// Reusable components for consistent styling
const ShadowLabel = ({ htmlFor, children }: { htmlFor: string; children: string }) => (
  <label htmlFor={htmlFor} className="block text-2xl font-bold font-neue-haas text-white mb-2 relative">
    <span className="absolute text-squarage-yellow transform translate-x-0.5 translate-y-0.5">{children}</span>
    <span className="relative z-10">{children}</span>
  </label>
)

// Simple label without shadow effect for form fields
const SimpleLabel = ({ htmlFor, children }: { htmlFor: string; children: string }) => (
  <label htmlFor={htmlFor} className="block text-2xl font-bold font-neue-haas text-white mb-2">
    {children}
  </label>
)

// Shared input styles for better performance
const inputBaseClasses = "w-full px-4 py-3 bg-cream font-neue-haas font-medium text-xl focus:outline-none relative z-10 border-0"
const textareaClasses = `${inputBaseClasses} resize-none`

const ShadowInput = ({ register, name, type = "text", placeholder, rows }: {
  register: any
  name: string
  type?: string
  placeholder: string
  rows?: number
}) => (
  <div className="relative">
    {rows ? (
      <textarea
        {...register(name)}
        id={name}
        rows={rows}
        className={textareaClasses}
        placeholder={placeholder}
      />
    ) : (
      <input
        {...register(name)}
        type={type}
        id={name}
        className={inputBaseClasses}
        placeholder={placeholder}
      />
    )}
    <div className="absolute top-0 left-0 w-full h-full bg-squarage-yellow transform translate-x-2 translate-y-2"></div>
  </div>
)

const ErrorMessage = ({ error, show }: { error?: { message?: string }, show: boolean }) => 
  error && show ? <p className="mt-1 text-white font-neue-haas">{error.message}</p> : null

// Reusable form field component
const FormField = ({ 
  name, 
  label, 
  register, 
  error, 
  type = "text", 
  placeholder, 
  rows,
  showErrors 
}: {
  name: string
  label: string
  register: any
  error?: { message?: string }
  type?: string
  placeholder: string
  rows?: number
  showErrors: boolean
}) => (
  <div>
    <SimpleLabel htmlFor={name}>{label}</SimpleLabel>
    <ShadowInput 
      register={register} 
      name={name} 
      type={type}
      placeholder={placeholder} 
      rows={rows}
    />
    <ErrorMessage error={error} show={showErrors} />
  </div>
)

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [showValidationErrors, setShowValidationErrors] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    mode: 'onBlur',
  })

  // Memoize button text to avoid re-renders
  const buttonText = useMemo(() => isSubmitting ? 'Sending...' : 'Send Message', [isSubmitting])
  
  // Memoize status messages
  const statusMessage = useMemo(() => {
    if (submitStatus === 'success') {
      return (
        <div className="mt-6 p-4 bg-squarage-green text-white font-neue-haas text-center">
          Thank you! Your message has been sent successfully. We&apos;ll get back to you soon.
        </div>
      )
    }
    if (submitStatus === 'error') {
      return (
        <div className="mt-6 p-4 bg-squarage-red text-white font-neue-haas text-center">
          Sorry, there was an error sending your message. Please try again.
        </div>
      )
    }
    return null
  }, [submitStatus])

  const onSubmit = useCallback(async (data: ContactFormData) => {
    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        setSubmitStatus('success')
        setShowValidationErrors(false)
        reset()
      } else {
        setSubmitStatus('error')
        setShowValidationErrors(true)
      }
    } catch (error) {
      setSubmitStatus('error')
      setShowValidationErrors(true)
    } finally {
      setIsSubmitting(false)
    }
  }, [reset])

  const onInvalidSubmit = useCallback(() => {
    // Show validation errors when form has validation errors
    setShowValidationErrors(true)
    // Clear any stuck hover states on mobile
    if ('ontouchstart' in window) {
      setTimeout(() => {
        (document.activeElement as HTMLElement)?.blur()
      }, 150)
    }
  }, [])

  return (
    <main className="min-h-screen bg-squarage-red pt-24 px-6 pb-16">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-6">
          <h1 className="text-5xl md:text-8xl font-bold font-neue-haas text-white tracking-widest relative">
            <span className="absolute text-squarage-yellow transform translate-x-1 translate-y-1">Contact Us</span>
            <span className="relative z-10">Contact Us</span>
          </h1>
        </div>

        {/* Contact Form */}
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit(onSubmit, onInvalidSubmit)} className="space-y-6">
            <FormField
              name="name"
              label="Name"
              register={register}
              error={errors.name}
              placeholder="Your name"
              showErrors={showValidationErrors}
            />
            
            <FormField
              name="email"
              label="Email"
              register={register}
              error={errors.email}
              type="email"
              placeholder="you@email.com"
              showErrors={showValidationErrors}
            />
            
            <FormField
              name="subject"
              label="Subject"
              register={register}
              error={errors.subject}
              placeholder="What can we help you with?"
              showErrors={showValidationErrors}
            />
            
            <FormField
              name="message"
              label="Message"
              register={register}
              error={errors.message}
              placeholder="Tell us about your project, timeline, and any specific requirements..."
              rows={6}
              showErrors={showValidationErrors}
            />

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-squarage-green font-bold font-neue-haas text-4xl py-4 px-8 border-2 border-squarage-green hover:bg-squarage-blue hover:border-squarage-blue hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative"
                onTouchEnd={(e) => {
                  // Force blur on mobile to clear any stuck hover states
                  if ('ontouchstart' in window) {
                    setTimeout(() => {
                      (e.target as HTMLElement)?.blur()
                    }, 150) // Small delay to allow animation to play
                  }
                }}
              >
                <span className="absolute inset-0 flex items-center justify-center text-squarage-yellow transform translate-x-0.5 translate-y-0.5">
                  {buttonText}
                </span>
                <span className="relative z-10 text-white">
                  {buttonText}
                </span>
              </button>
            </div>
          </form>

          {/* Status Messages */}
          {statusMessage}
        </div>
      </div>
    </main>
  )
}