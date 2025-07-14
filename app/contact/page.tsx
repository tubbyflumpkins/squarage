'use client'

import { useState } from 'react'
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

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    mode: 'onBlur',
  })

  const onSubmit = async (data: ContactFormData) => {
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
        reset()
      } else {
        setSubmitStatus('error')
      }
    } catch (error) {
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-cream pt-24 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-7xl font-bold font-neue-haas text-squarage-black mb-4">
            Contact Us
          </h1>
          <p className="text-xl md:text-2xl font-neue-haas text-brown-medium max-w-2xl mx-auto">
            Ready to discuss your custom furniture project? We&apos;d love to hear from you.
          </p>
        </div>

        {/* Contact Form */}
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-lg font-medium font-neue-haas text-squarage-black mb-2">
                Name *
              </label>
              <input
                {...register('name')}
                type="text"
                id="name"
                className="w-full px-4 py-3 border-2 border-squarage-black bg-cream font-neue-haas text-lg focus:outline-none focus:border-squarage-green transition-colors duration-300"
                placeholder="Your full name"
              />
              {errors.name && (
                <p className="mt-1 text-squarage-red font-neue-haas">{errors.name.message}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-lg font-medium font-neue-haas text-squarage-black mb-2">
                Email *
              </label>
              <input
                {...register('email')}
                type="email"
                id="email"
                className="w-full px-4 py-3 border-2 border-squarage-black bg-cream font-neue-haas text-lg focus:outline-none focus:border-squarage-green transition-colors duration-300"
                placeholder="your@email.com"
              />
              {errors.email && (
                <p className="mt-1 text-squarage-red font-neue-haas">{errors.email.message}</p>
              )}
            </div>

            {/* Subject Field */}
            <div>
              <label htmlFor="subject" className="block text-lg font-medium font-neue-haas text-squarage-black mb-2">
                Subject *
              </label>
              <input
                {...register('subject')}
                type="text"
                id="subject"
                className="w-full px-4 py-3 border-2 border-squarage-black bg-cream font-neue-haas text-lg focus:outline-none focus:border-squarage-green transition-colors duration-300"
                placeholder="What can we help you with?"
              />
              {errors.subject && (
                <p className="mt-1 text-squarage-red font-neue-haas">{errors.subject.message}</p>
              )}
            </div>

            {/* Message Field */}
            <div>
              <label htmlFor="message" className="block text-lg font-medium font-neue-haas text-squarage-black mb-2">
                Message *
              </label>
              <textarea
                {...register('message')}
                id="message"
                rows={6}
                className="w-full px-4 py-3 border-2 border-squarage-black bg-cream font-neue-haas text-lg resize-none focus:outline-none focus:border-squarage-green transition-colors duration-300"
                placeholder="Tell us about your project, timeline, and any specific requirements..."
              />
              {errors.message && (
                <p className="mt-1 text-squarage-red font-neue-haas">{errors.message.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-squarage-green text-white font-bold font-neue-haas text-xl py-4 px-8 border-2 border-squarage-green hover:bg-cream hover:text-squarage-green transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </form>

          {/* Status Messages */}
          {submitStatus === 'success' && (
            <div className="mt-6 p-4 bg-squarage-green text-white font-neue-haas text-center">
              Thank you! Your message has been sent successfully. We&apos;ll get back to you soon.
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="mt-6 p-4 bg-squarage-red text-white font-neue-haas text-center">
              Sorry, there was an error sending your message. Please try again.
            </div>
          )}
        </div>

        {/* Contact Information */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl md:text-3xl font-bold font-neue-haas text-squarage-black mb-6">
            Other Ways to Reach Us
          </h2>
          <div className="space-y-4 font-neue-haas text-brown-medium">
            <p className="text-lg">
              <a 
                href="mailto:info@squarage.com"
                className="hover:text-squarage-green transition-colors duration-300"
              >
                info@squarage.com
              </a>
            </p>
            <p className="text-lg">
              <a 
                href="https://instagram.com/squaragestudio"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-squarage-green transition-colors duration-300"
              >
                @squaragestudio
              </a>
            </p>
            <p className="text-sm uppercase tracking-wider">
              Los Angeles, CA
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}