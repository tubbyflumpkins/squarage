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
      return { ...state, isOpen: false, error: null }

    case 'SET_CHECKOUT':
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
  const initializeCheckout = async (): Promise<string | null> => {
    dispatch({ type: 'SET_LOADING', payload: true })

    try {
      // Reuse a stored checkout when one is still valid
      const storedCheckoutId = localStorage.getItem('shopify_checkout_id')

      if (storedCheckoutId) {
        const existingCheckout = await shopifyApi.getCheckout(storedCheckoutId)

        if (existingCheckout) {
          dispatch({ type: 'SET_CHECKOUT', payload: existingCheckout })
          return existingCheckout.id
        }
        // Stale/expired id — drop it and create a fresh checkout
        localStorage.removeItem('shopify_checkout_id')
      }

      const checkout = await shopifyApi.createCheckout()
      if (checkout) {
        dispatch({ type: 'SET_CHECKOUT', payload: checkout })
        localStorage.setItem('shopify_checkout_id', checkout.id)
        return checkout.id
      }

      dispatch({ type: 'SET_ERROR', payload: 'Failed to initialize cart' })
      return null
    } catch (error) {
      console.error('Error initializing checkout:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to initialize cart' })
      return null
    }
  }

  // Add item to cart
  const addToCart = async (variantId: string, quantity: number = 1) => {
    dispatch({ type: 'SET_ERROR', payload: null })
    dispatch({ type: 'SET_LOADING', payload: true })

    try {
      // Recover if the mount-time checkout creation failed (null checkoutId)
      let checkoutId = state.checkoutId
      if (!checkoutId) {
        checkoutId = await initializeCheckout()
      }
      if (!checkoutId) {
        dispatch({ type: 'SET_ERROR', payload: 'Could not start a cart. Please try again.' })
        dispatch({ type: 'OPEN_CART' })
        return
      }

      const checkout = await shopifyApi.addToCheckout(checkoutId, [{ variantId, quantity }])
      if (!checkout) throw new Error('No checkout returned from addToCheckout')
      dispatch({ type: 'SET_CHECKOUT', payload: checkout })
      dispatch({ type: 'OPEN_CART' })
    } catch (error) {
      console.error('Error adding to cart:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to add item to cart. Please try again.' })
      dispatch({ type: 'OPEN_CART' })
    }
  }

  // Update cart item quantity
  const updateCartItem = async (lineItemId: string, quantity: number) => {
    if (!state.checkoutId) return

    dispatch({ type: 'SET_ERROR', payload: null })
    dispatch({ type: 'SET_LOADING', payload: true })

    try {
      const checkout = await shopifyApi.updateCheckout(state.checkoutId, [{ id: lineItemId, quantity }])
      if (!checkout) throw new Error('No checkout returned from updateCheckout')
      dispatch({ type: 'SET_CHECKOUT', payload: checkout })
    } catch (error) {
      console.error('Error updating cart item:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update cart item. Please try again.' })
    }
  }

  // Remove item from cart
  const removeFromCart = async (lineItemId: string) => {
    if (!state.checkoutId) return

    dispatch({ type: 'SET_ERROR', payload: null })
    dispatch({ type: 'SET_LOADING', payload: true })

    try {
      const checkout = await shopifyApi.removeFromCheckout(state.checkoutId, [lineItemId])
      if (!checkout) throw new Error('No checkout returned from removeFromCheckout')
      dispatch({ type: 'SET_CHECKOUT', payload: checkout })
    } catch (error) {
      console.error('Error removing from cart:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to remove item from cart. Please try again.' })
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