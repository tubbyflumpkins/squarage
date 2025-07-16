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
  color: string
}

interface CartPosition {
  x: number
  y: number
  width: number
  height: number
}

interface EncouragementMessage {
  id: number
  text: string
  x: number
  y: number
  rotation: number
  opacity: number
  fadeStartTime: number
}

export default function EasterEggGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const requestRef = useRef<number>()
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [gameState, setGameState] = useState<'countdown' | 'playing' | 'gameOver'>('countdown')
  const [countdown, setCountdown] = useState(3)
  
  // Game state refs to avoid stale closures
  const squaresRef = useRef<FallingSquare[]>([])
  const cartRef = useRef<CartPosition>({ x: 0, y: 0, width: 80, height: 60 })
  const nextSquareIdRef = useRef(0)
  const lastSpawnTimeRef = useRef(0)
  const mouseXRef = useRef<number | null>(null)
  const messagesRef = useRef<EncouragementMessage[]>([])
  const nextMessageIdRef = useRef(0)
  const baseSpeedRef = useRef(4)
  
  // Color options for falling squares (removed green to avoid confusion with grass)
  const squareColors = ['#F04E23', '#F7901E', '#F5B74C', '#01BAD5'] // red, orange, yellow, blue
  
  // Encouraging messages
  const encouragementMessages = [
    "Wow!",
    "Good job!",
    "Keep shopping!",
    "Great work!",
    "Awesome!",
    "Fantastic!",
    "You're amazing!",
    "Well done!",
    "Incredible!",
    "Outstanding!"
  ]
  
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
  
  // Countdown timer
  useEffect(() => {
    if (gameState === 'countdown' && countdown > 0) {
      const timer = setTimeout(() => {
        if (countdown === 1) {
          setGameState('playing')
        } else {
          setCountdown(countdown - 1)
        }
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [gameState, countdown])
  
  // Spawn new squares
  const spawnSquare = useCallback((canvasWidth: number) => {
    const now = Date.now()
    // Spawn rate increases every 15 points - starts at 1000ms, reduces by 100ms each level
    const spawnLevels = Math.floor(score / 15)
    const spawnInterval = Math.max(300, 1000 - (spawnLevels * 100)) // Minimum 300ms between spawns
    
    if (now - lastSpawnTimeRef.current > spawnInterval) {
      lastSpawnTimeRef.current = now
      const randomColor = squareColors[Math.floor(Math.random() * squareColors.length)]
      // Speed increases every 7 points
      const currentSpeed = baseSpeedRef.current + Math.floor(score / 7)
      squaresRef.current.push({
        id: nextSquareIdRef.current++,
        x: Math.random() * (canvasWidth - 30),
        y: -30,
        size: 30,
        speed: currentSpeed,
        color: randomColor
      })
    }
  }, [squareColors, score])
  
  // Check if a position overlaps with existing messages
  const checkMessageOverlap = useCallback((x: number, y: number, buffer: number = 80) => {
    return messagesRef.current.some(message => {
      const distance = Math.sqrt(Math.pow(x - message.x, 2) + Math.pow(y - message.y, 2))
      return distance < buffer
    })
  }, [])

  // Spawn encouragement message above cart
  const spawnEncouragementMessage = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const randomMessage = encouragementMessages[Math.floor(Math.random() * encouragementMessages.length)]
    const cartCenterX = cartRef.current.x + cartRef.current.width / 2
    
    // Message size estimation (approximate width/height for bounds checking)
    const messageWidth = 120 // Approximate width for bounds checking
    const messageHeight = 40 // Approximate height for bounds checking
    
    let x, y
    let attempts = 0
    const maxAttempts = 20
    
    // Try to find a valid position that doesn't overlap and stays in bounds
    do {
      // Position above the cart with some horizontal variation
      const offsetX = (Math.random() - 0.5) * 120 // -60 to +60 pixels from cart center
      const offsetY = -60 - (Math.random() * 80) // 60-140 pixels above cart
      x = cartCenterX + offsetX
      y = cartRef.current.y + offsetY
      
      // Clamp to browser bounds with padding
      x = Math.max(messageWidth / 2, Math.min(canvas.width - messageWidth / 2, x))
      y = Math.max(messageHeight / 2, Math.min(canvas.height - messageHeight / 2, y))
      
      attempts++
    } while (checkMessageOverlap(x, y) && attempts < maxAttempts)
    
    // If we couldn't find a non-overlapping position after max attempts, use the last position anyway
    const rotation = (Math.random() - 0.5) * 40 // -20 to +20 degrees
    
    messagesRef.current.push({
      id: nextMessageIdRef.current++,
      text: randomMessage,
      x,
      y,
      rotation,
      opacity: 1,
      fadeStartTime: Date.now()
    })
  }, [encouragementMessages, checkMessageOverlap])
  
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
  
  // Background drawing function (used for both countdown and playing states)
  const drawBackground = useCallback((canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
    // Draw sky background - full screen
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, '#87CEEB') // Sky blue at top
    gradient.addColorStop(0.7, '#B0E0E6') // Lighter blue at horizon
    gradient.addColorStop(1, '#B0E0E6') // Continue to bottom
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Draw multiple clouds spread throughout the sky
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    // Cloud 1 - top left
    ctx.beginPath()
    ctx.arc(canvas.width * 0.15, canvas.height * 0.1, 20, 0, Math.PI * 2)
    ctx.arc(canvas.width * 0.15 + 15, canvas.height * 0.1, 25, 0, Math.PI * 2)
    ctx.arc(canvas.width * 0.15 + 35, canvas.height * 0.1, 20, 0, Math.PI * 2)
    ctx.fill()
    // Cloud 2 - top center
    ctx.beginPath()
    ctx.arc(canvas.width * 0.4, canvas.height * 0.08, 15, 0, Math.PI * 2)
    ctx.arc(canvas.width * 0.4 + 20, canvas.height * 0.08, 25, 0, Math.PI * 2)
    ctx.arc(canvas.width * 0.4 + 40, canvas.height * 0.08, 15, 0, Math.PI * 2)
    ctx.fill()
    // Cloud 3 - top right
    ctx.beginPath()
    ctx.arc(canvas.width * 0.7, canvas.height * 0.12, 18, 0, Math.PI * 2)
    ctx.arc(canvas.width * 0.7 + 25, canvas.height * 0.12, 30, 0, Math.PI * 2)
    ctx.arc(canvas.width * 0.7 + 50, canvas.height * 0.12, 18, 0, Math.PI * 2)
    ctx.fill()
    // Cloud 4 - middle left
    ctx.beginPath()
    ctx.arc(canvas.width * 0.1, canvas.height * 0.25, 16, 0, Math.PI * 2)
    ctx.arc(canvas.width * 0.1 + 20, canvas.height * 0.25, 28, 0, Math.PI * 2)
    ctx.arc(canvas.width * 0.1 + 45, canvas.height * 0.25, 16, 0, Math.PI * 2)
    ctx.fill()
    // Cloud 5 - middle right
    ctx.beginPath()
    ctx.arc(canvas.width * 0.85, canvas.height * 0.18, 12, 0, Math.PI * 2)
    ctx.arc(canvas.width * 0.85 + 15, canvas.height * 0.18, 20, 0, Math.PI * 2)
    ctx.arc(canvas.width * 0.85 + 30, canvas.height * 0.18, 12, 0, Math.PI * 2)
    ctx.fill()
    // Cloud 6 - middle center
    ctx.beginPath()
    ctx.arc(canvas.width * 0.5, canvas.height * 0.35, 14, 0, Math.PI * 2)
    ctx.arc(canvas.width * 0.5 + 18, canvas.height * 0.35, 22, 0, Math.PI * 2)
    ctx.arc(canvas.width * 0.5 + 38, canvas.height * 0.35, 14, 0, Math.PI * 2)
    ctx.fill()
    
    // Draw rolling hills of grass
    ctx.fillStyle = '#4A9B4E' // Using squarage-green
    ctx.beginPath()
    ctx.moveTo(0, canvas.height * 0.7)
    // Create rolling hills with sine wave - extend slightly beyond canvas width
    for (let x = 0; x <= canvas.width + 20; x += 20) {
      const y = canvas.height * 0.7 + Math.sin(x * 0.01) * 30 + Math.sin(x * 0.005) * 20
      ctx.lineTo(x, y)
    }
    // Close the path properly to avoid sharp edges
    ctx.lineTo(canvas.width, canvas.height)
    ctx.lineTo(0, canvas.height)
    ctx.closePath()
    ctx.fill()
    
    // Draw cart (always visible)
    ctx.fillStyle = '#2274A5' // Dark blue (squarage-dark-blue)
    ctx.fillRect(cartRef.current.x, cartRef.current.y, cartRef.current.width, cartRef.current.height)
    
    // Draw cart handle
    ctx.strokeStyle = '#2274A5'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(cartRef.current.x + 10, cartRef.current.y + 10)
    ctx.lineTo(cartRef.current.x - 10, cartRef.current.y - 10)
    ctx.stroke()
    
    // Draw wheels
    ctx.fillStyle = '#2274A5'
    ctx.beginPath()
    ctx.arc(cartRef.current.x + 20, cartRef.current.y + cartRef.current.height + 5, 5, 0, Math.PI * 2)
    ctx.arc(cartRef.current.x + cartRef.current.width - 20, cartRef.current.y + cartRef.current.height + 5, 5, 0, Math.PI * 2)
    ctx.fill()
    
    // Draw and update encouragement messages
    const now = Date.now()
    const remainingMessages: EncouragementMessage[] = []
    
    messagesRef.current.forEach(message => {
      const elapsed = now - message.fadeStartTime
      const fadeOutTime = 3000 // 3 seconds
      
      if (elapsed < fadeOutTime) {
        // Calculate opacity (fade out over time)
        const opacity = Math.max(0, 1 - (elapsed / fadeOutTime))
        
        // Draw message
        ctx.save()
        ctx.translate(message.x, message.y)
        ctx.rotate(message.rotation * Math.PI / 180)
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`
        ctx.strokeStyle = `rgba(255, 150, 0, ${opacity})`
        ctx.font = 'bold 32px neue-haas-grotesk, sans-serif'
        ctx.lineWidth = 2
        ctx.textAlign = 'center'
        ctx.strokeText(message.text, 0, 0)
        ctx.fillText(message.text, 0, 0)
        ctx.restore()
        
        remainingMessages.push(message)
      }
    })
    
    messagesRef.current = remainingMessages
  }, [])
  
  // Countdown loop (shows background during countdown)
  const countdownLoop = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || gameState !== 'countdown') return
    
    // Draw background (sky, clouds, hills, cart)
    drawBackground(canvas, ctx)
    
    requestRef.current = requestAnimationFrame(countdownLoop)
  }, [gameState, drawBackground])
  
  // Game loop
  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || gameState !== 'playing') return
    
    // Draw background (sky, clouds, hills, cart)
    drawBackground(canvas, ctx)
    
    // Update cart position
    updateCartPosition(canvas)
    
    // Spawn new squares (only during playing state)
    spawnSquare(canvas.width)
    
    // Update and draw falling squares
    const remainingSquares: FallingSquare[] = []
    
    squaresRef.current.forEach(square => {
      // Update position
      square.y += square.speed
      
      // Check collision with cart
      if (checkCollision(square, cartRef.current)) {
        setScore(prev => {
          const newScore = prev + 1
          // Spawn encouragement message every 7 squares
          if (newScore % 7 === 0) {
            spawnEncouragementMessage()
          }
          return newScore
        })
        return // Remove caught square
      }
      
      // Keep square if still on screen
      if (square.y < canvas.height) {
        remainingSquares.push(square)
        
        // Draw square with its random color
        ctx.fillStyle = square.color
        ctx.fillRect(square.x, square.y, square.size, square.size)
      } else {
        // Square fell off screen - lose a life
        setLives(prev => {
          const newLives = prev - 1
          if (newLives <= 0) {
            setGameState('gameOver')
          }
          return newLives
        })
      }
    })
    
    squaresRef.current = remainingSquares
    
    requestRef.current = requestAnimationFrame(gameLoop)
  }, [gameState, spawnSquare, updateCartPosition, drawBackground, spawnEncouragementMessage])
  
  // Start countdown and game loops
  useEffect(() => {
    if (gameState === 'countdown') {
      requestRef.current = requestAnimationFrame(countdownLoop)
    } else if (gameState === 'playing') {
      requestRef.current = requestAnimationFrame(gameLoop)
    }
    
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
    }
  }, [gameLoop, countdownLoop, gameState])
  
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
      {/* Score and Lives display - positioned below main nav */}
      <div className="absolute top-16 sm:top-20 right-0 z-10 p-4 sm:p-6">
        <div className="text-right">
          <p className="text-2xl sm:text-3xl font-bold font-neue-haas text-orange">
            Score: {score}
          </p>
          {/* Lives hearts */}
          <div className="flex justify-end mt-2 space-x-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={`w-6 h-6 ${i < lives ? 'text-squarage-red' : 'text-gray-300'}`}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Game Canvas - full screen */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        style={{ touchAction: 'none' }}
      />
      
      {/* Countdown overlay */}
      {gameState === 'countdown' && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="text-8xl sm:text-9xl font-bold font-neue-haas text-orange">
            {countdown === 0 ? 'GO!' : countdown}
          </div>
        </div>
      )}
      
      {/* Game Over Menu */}
      {gameState === 'gameOver' && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="bg-squarage-green rounded-lg p-8 text-center max-w-md mx-4">
            <h2 className="text-3xl sm:text-4xl font-bold font-neue-haas text-white mb-4">
              Oh no!
            </h2>
            <p className="text-lg sm:text-xl font-neue-haas text-white mb-6">
              You didn't add enough to your cart
            </p>
            <Link href="/">
              <button className="bg-squarage-orange font-bold font-neue-haas text-2xl py-4 px-8 text-white hover:bg-squarage-yellow hover:scale-105 transition-all duration-300 relative">
                <span className="absolute inset-0 flex items-center justify-center text-squarage-red transform translate-x-0.5 translate-y-0.5">
                  :(
                </span>
                <span className="relative z-10 text-white">
                  :(
                </span>
              </button>
            </Link>
          </div>
        </div>
      )}
      
      {/* Instructions (shown briefly) */}
      {gameState === 'playing' && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center z-10">
          <p className="text-sm sm:text-base font-neue-haas text-orange opacity-75">
            Move your cart to catch the falling squares!
          </p>
        </div>
      )}
    </div>
  )
}