'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { CheckIcon, PlusIcon } from '@heroicons/react/24/outline'

interface Product {
  _id: string
  name: string
  category: 'Detox' | 'Mitochondrial'
  description: string
  dosage: string
  frequency: string
}

interface ProductUsage {
  _id: string
  productId: string
  date: string
  isCompleted: boolean
  scheduledTime?: string
}

export default function ProductTracking() {
  const { data: session } = useSession()
  const [products, setProducts] = useState<Product[]>([])
  const [usageData, setUsageData] = useState<{ [key: string]: ProductUsage }>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProductsAndUsage = async () => {
      if (session?.user?.id) {
        try {
          // Fetch all products
          const productsRes = await fetch('/api/products')
          const productsData = await productsRes.json()
          setProducts(productsData)

          // Fetch today's usage
          const today = new Date().toISOString().split('T')[0]
          const usageRes = await fetch(`/api/product-usage?date=${today}`)
          const usageList = await usageRes.json()
          
          // Convert usage list to map for easier lookup
          const usageMap = usageList.reduce((acc: any, usage: ProductUsage) => {
            acc[usage.productId] = usage
            return acc
          }, {})
          
          setUsageData(usageMap)
        } catch (error) {
          console.error('Failed to fetch products:', error)
        } finally {
          setLoading(false)
        }
      }
    }

    fetchProductsAndUsage()
  }, [session])

  const toggleProductUsage = async (productId: string) => {
    try {
      const usage = usageData[productId]
      const method = usage ? 'PUT' : 'POST'
      const endpoint = '/api/product-usage'
      
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          isCompleted: usage ? !usage.isCompleted : true,
          date: new Date().toISOString(),
          ...(usage && { id: usage._id })
        })
      })

      if (res.ok) {
        const updatedUsage = await res.json()
        setUsageData(prev => ({
          ...prev,
          [productId]: updatedUsage
        }))
      }
    } catch (error) {
      console.error('Failed to update product usage:', error)
    }
  }

  if (loading) {
    return (
      <div className="bg-card text-card-foreground rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 bg-muted rounded w-full"></div>
          ))}
        </div>
      </div>
    )
  }

  const categorizedProducts = products.reduce((acc: { [key: string]: Product[] }, product) => {
    if (!acc[product.category]) {
      acc[product.category] = []
    }
    acc[product.category].push(product)
    return acc
  }, {})

  return (
    <div className="bg-card text-card-foreground rounded-lg shadow p-6">
      <div className="flex items-center mb-6">
        <PlusIcon className="h-6 w-6 text-primary mr-2" />
        <h2 className="text-xl font-semibold text-foreground">Product Tracking</h2>
      </div>

      {Object.entries(categorizedProducts).map(([category, categoryProducts]) => (
        <div key={category} className="mb-6 last:mb-0">
          <h3 className="text-lg font-medium text-foreground mb-3">{category}</h3>
          <div className="space-y-3">
            {categoryProducts.map((product) => {
              const usage = usageData[product._id]
              return (
                <div
                  key={product._id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    usage?.isCompleted
                      ? 'bg-primary/10 border-primary/20 dark:bg-primary/20 dark:border-primary/30'
                      : 'bg-card border-border'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h4 className="text-sm font-medium text-foreground">
                        {product.name}
                      </h4>
                      {usage?.isCompleted && (
                        <CheckIcon className="h-5 w-5 text-primary ml-2" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {product.dosage} {product.frequency && `• ${product.frequency}`}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleProductUsage(product._id)}
                    className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                      usage?.isCompleted
                        ? 'bg-primary text-white hover:bg-primary/90'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                    aria-label={usage?.isCompleted ? "Mark as incomplete" : "Mark as complete"}
                  >
                    <CheckIcon className="h-4 w-4" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
