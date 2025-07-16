'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface FallingSquare {
  id: number
  x: number
  y: number
  size: number
  speed: number
}

interface CartPosition {
  x: number
  y: number
  width: number
  height: number
}

export default function EasterEggGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const requestRef = useRef<number>()
  const [score, setScore] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  
  // Game state refs to avoid stale closures
  const squaresRef = useRef<FallingSquare[]>([])
  const cartRef = useRef<CartPosition>({ x: 0, y: 0, width: 80, height: 60 })
  const nextSquareIdRef = useRef(0)
  const lastSpawnTimeRef = useRef(0)
  const mouseXRef = useRef<number | null>(null)
  
  // Initialize cart position
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    cartRef.current = {
      x: rect.width / 2 - 40,
      y: rect.height - 80,
      width: 80,
      height: 60
    }
  }, [])
  
  // Spawn new squares
  const spawnSquare = useCallback((canvasWidth: number) => {
    const now = Date.now()
    if (now - lastSpawnTimeRef.current > 1000) { // Spawn every 1 second
      lastSpawnTimeRef.current = now
      squaresRef.current.push({
        id: nextSquareIdRef.current++,
        x: Math.random() * (canvasWidth - 30),
        y: -30,
        size: 30,
        speed: 3
      })
    }
  }, [])
  
  // Check collision between square and cart
  const checkCollision = (square: FallingSquare, cart: CartPosition): boolean => {
    return (
      square.x < cart.x + cart.width &&
      square.x + square.size > cart.x &&
      square.y < cart.y + cart.height &&
      square.y + square.size > cart.y
    )
  }
  
  // Update cart position based on mouse/touch
  const updateCartPosition = useCallback((canvas: HTMLCanvasElement) => {
    if (mouseXRef.current !== null) {
      const rect = canvas.getBoundingClientRect()
      const relativeX = mouseXRef.current - rect.left
      cartRef.current.x = Math.max(0, Math.min(relativeX - cartRef.current.width / 2, canvas.width - cartRef.current.width))
    }
  }, [])
  
  // Game loop
  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || !isPlaying) return
    
    // Clear canvas
    ctx.fillStyle = '#fffaf4' // Cream background
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Update cart position
    updateCartPosition(canvas)
    
    // Spawn new squares
    spawnSquare(canvas.width)
    
    // Update and draw falling squares
    const remainingSquares: FallingSquare[] = []
    
    squaresRef.current.forEach(square => {
      // Update position
      square.y += square.speed
      
      // Check collision with cart
      if (checkCollision(square, cartRef.current)) {
        setScore(prev => prev + 1)
        return // Remove caught square
      }
      
      // Keep square if still on screen
      if (square.y < canvas.height) {
        remainingSquares.push(square)
        
        // Draw square
        ctx.fillStyle = '#ff962d' // Orange
        ctx.fillRect(square.x, square.y, square.size, square.size)
      }
    })
    
    squaresRef.current = remainingSquares
    
    // Draw cart (shopping cart icon simplified as rectangle)
    ctx.fillStyle = '#f7a24d' // Light orange (orange-light)
    ctx.fillRect(cartRef.current.x, cartRef.current.y, cartRef.current.width, cartRef.current.height)
    
    // Draw cart handle
    ctx.strokeStyle = '#ff962d'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(cartRef.current.x + 10, cartRef.current.y + 10)
    ctx.lineTo(cartRef.current.x - 10, cartRef.current.y - 10)
    ctx.stroke()
    
    // Draw wheels
    ctx.fillStyle = '#ff962d'
    ctx.beginPath()
    ctx.arc(cartRef.current.x + 20, cartRef.current.y + cartRef.current.height + 5, 5, 0, Math.PI * 2)
    ctx.arc(cartRef.current.x + cartRef.current.width - 20, cartRef.current.y + cartRef.current.height + 5, 5, 0, Math.PI * 2)
    ctx.fill()
    
    requestRef.current = requestAnimationFrame(gameLoop)
  }, [isPlaying, spawnSquare, updateCartPosition])
  
  // Start game loop
  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(gameLoop)
    }
    
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
    }
  }, [gameLoop, isPlaying])
  
  // Handle mouse/touch events
  const handlePointerMove = (e: React.PointerEvent) => {
    mouseXRef.current = e.clientX
  }
  
  const handlePointerLeave = () => {
    mouseXRef.current = null
  }
  
  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      
      // Update cart position
      cartRef.current.y = canvas.height - 80
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  return (
    <div className="fixed inset-0 bg-cream overflow-hidden">
      {/* Header with logo and score */}
      <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-start p-4 sm:p-6">
        <Link href="/" className="block">
          <Image
            src="/images/Squarage Logo - Original Colors.svg"
            alt="Squarage Studio"
            width={150}
            height={48}
            className="w-32 sm:w-40"
          />
        </Link>
        
        <div className="text-right">
          <p className="text-2xl sm:text-3xl font-bold font-neue-haas text-orange">
            Score: {score}
          </p>
        </div>
      </div>
      
      {/* Game Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        style={{ touchAction: 'none' }}
      />
      
      {/* Instructions (shown briefly) */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center">
        <p className="text-sm sm:text-base font-neue-haas text-orange opacity-75">
          Move your cart to catch the falling squares!
        </p>
      </div>
    </div>
  )
}