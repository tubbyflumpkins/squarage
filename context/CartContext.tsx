'use client'

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { shopifyApi } from '@/lib/shopify'

// Cart types
interface CartLineItem {
  id: string
  variantId: string
  productId: string
  title: string
  variantTitle: string
  quantity: number
  price: {
    amount: string
    currencyCode: string
  }
  image?: {
    url: string
    altText?: string
  }
}

interface CartState {
  isOpen: boolean
  lineItems: CartLineItem[]
  checkoutId: string | null
  checkoutUrl: string | null
  totalPrice: {
    amount: string
    currencyCode: string
  }
  subtotalPrice: {
    amount: string
    currencyCode: string
  }
  totalQuantity: number
  isLoading: boolean
  error: string | null
}

// Cart actions
type CartAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'TOGGLE_CART' }
  | { type: 'OPEN_CART' }
  | { type: 'CLOSE_CART' }
  | { type: 'SET_CHECKOUT'; payload: any }
  | { type: 'ADD_LINE_ITEM'; payload: CartLineItem }
  | { type: 'UPDATE_LINE_ITEM'; payload: { id: string; quantity: number } }
  | { type: 'REMOVE_LINE_ITEM'; payload: string }
  | { type: 'CLEAR_CART' }

// Initial state
const initialState: CartState = {
  isOpen: false,
  lineItems: [],
  checkoutId: null,
  checkoutUrl: null,
  totalPrice: { amount: '0.00', currencyCode: 'USD' },
  subtotalPrice: { amount: '0.00', currencyCode: 'USD' },
  totalQuantity: 0,
  isLoading: false,
  error: null,
}

// Cart reducer
function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false }
    
    case 'TOGGLE_CART':
      return { ...state, isOpen: !state.isOpen }
    
    case 'OPEN_CART':
      return { ...state, isOpen: true }
    
    case 'CLOSE_CART':
      return { ...state, isOpen: false }
    
    case 'SET_CHECKOUT':
      // Debug: log the checkout payload to understand structure
      console.log('SET_CHECKOUT payload:', action.payload)
      console.log('Line items:', action.payload.lineItems)
      return {
        ...state,
        checkoutId: action.payload.id,
        checkoutUrl: action.payload.webUrl,
        lineItems: action.payload.lineItems || [],
        totalPrice: action.payload.totalPrice || state.totalPrice,
        subtotalPrice: action.payload.subtotalPrice || state.subtotalPrice,
        totalQuantity: action.payload.lineItems?.reduce((total: number, item: any) => total + item.quantity, 0) || 0,
        isLoading: false,
      }
    
    case 'CLEAR_CART':
      return {
        ...state,
        lineItems: [],
        totalQuantity: 0,
        totalPrice: { amount: '0.00', currencyCode: 'USD' },
        subtotalPrice: { amount: '0.00', currencyCode: 'USD' },
      }
    
    default:
      return state
  }
}

// Cart context
interface CartContextType {
  state: CartState
  addToCart: (variantId: string, quantity?: number) => Promise<void>
  updateCartItem: (lineItemId: string, quantity: number) => Promise<void>
  removeFromCart: (lineItemId: string) => Promise<void>
  clearCart: () => void
  toggleCart: () => void
  openCart: () => void
  closeCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

// Cart provider
interface CartProviderProps {
  children: ReactNode
}

export function CartProvider({ children }: CartProviderProps) {
  const [state, dispatch] = useReducer(cartReducer, initialState)

  // Initialize checkout on mount
  useEffect(() => {
    initializeCheckout()
  }, [])

  // Initialize or retrieve checkout
  const initializeCheckout = async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    
    try {
      // Check if we have a stored checkout ID
      const storedCheckoutId = localStorage.getItem('shopify_checkout_id')
      
      if (storedCheckoutId) {
        console.log('Attempting to retrieve existing checkout:', storedCheckoutId)
        // Try to fetch existing checkout
        const existingCheckout = await shopifyApi.getCheckout(storedCheckoutId)
        
        if (existingCheckout) {
          console.log('Successfully retrieved existing checkout with items:', existingCheckout.lineItems?.length || 0)
          dispatch({ type: 'SET_CHECKOUT', payload: existingCheckout })
          return
        } else {
          console.log('Existing checkout not found or expired, creating new one')
          // Clear invalid checkout ID
          localStorage.removeItem('shopify_checkout_id')
        }
      }
      
      // Create new checkout if no valid existing one
      console.log('Creating new checkout')
      const checkout = await shopifyApi.createCheckout()
      if (checkout) {
        dispatch({ type: 'SET_CHECKOUT', payload: checkout })
        localStorage.setItem('shopify_checkout_id', checkout.id)
        console.log('New checkout created:', checkout.id)
      }
    } catch (error) {
      console.error('Error initializing checkout:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to initialize cart' })
    }
  }

  // Add item to cart
  const addToCart = async (variantId: string, quantity: number = 1) => {
    if (!state.checkoutId) return
    
    dispatch({ type: 'SET_LOADING', payload: true })
    
    try {
      const lineItemsToAdd = [{
        variantId,
        quantity,
      }]
      
      const checkout = await shopifyApi.addToCheckout(state.checkoutId, lineItemsToAdd)
      if (checkout) {
        dispatch({ type: 'SET_CHECKOUT', payload: checkout })
        dispatch({ type: 'OPEN_CART' })
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to add item to cart' })
    }
  }

  // Update cart item quantity
  const updateCartItem = async (lineItemId: string, quantity: number) => {
    if (!state.checkoutId) return
    
    dispatch({ type: 'SET_LOADING', payload: true })
    
    try {
      const lineItemsToUpdate = [{
        id: lineItemId,
        quantity,
      }]
      
      const checkout = await shopifyApi.updateCheckout(state.checkoutId, lineItemsToUpdate)
      if (checkout) {
        dispatch({ type: 'SET_CHECKOUT', payload: checkout })
      }
    } catch (error) {
      console.error('Error updating cart item:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update cart item' })
    }
  }

  // Remove item from cart
  const removeFromCart = async (lineItemId: string) => {
    if (!state.checkoutId) return
    
    dispatch({ type: 'SET_LOADING', payload: true })
    
    try {
      const checkout = await shopifyApi.removeFromCheckout(state.checkoutId, [lineItemId])
      if (checkout) {
        dispatch({ type: 'SET_CHECKOUT', payload: checkout })
      }
    } catch (error) {
      console.error('Error removing from cart:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to remove item from cart' })
    }
  }

  // Clear cart
  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' })
  }

  // Toggle cart
  const toggleCart = () => {
    dispatch({ type: 'TOGGLE_CART' })
  }

  // Open cart
  const openCart = () => {
    dispatch({ type: 'OPEN_CART' })
  }

  // Close cart
  const closeCart = () => {
    dispatch({ type: 'CLOSE_CART' })
  }

  const value: CartContextType = {
    state,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    toggleCart,
    openCart,
    closeCart,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

// Custom hook to use cart
export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}