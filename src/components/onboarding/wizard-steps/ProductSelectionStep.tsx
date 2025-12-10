'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, Check, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Product interface based on existing MongoDB schema
interface Product {
  _id: string;
  name: string;
  category: string;
  description: string;
  dosage: string;
  frequency: string;
  phases: number[];
}

interface ProductSelectionStepProps {
  selectedProducts: string[];
  onUpdateProducts: (products: string[]) => void;
}

export default function ProductSelectionStep({
  selectedProducts,
  onUpdateProducts
}: ProductSelectionStepProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [currentTab, setCurrentTab] = useState('recommended')

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products')
        const data = await response.json()
        setProducts(data)
      } catch (error) {
        console.error('Failed to fetch products:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchProducts()
  }, [])

  // Mock products for demonstration
  useEffect(() => {
    if (isLoading) {
      const mockProducts: Product[] = [
        {
          _id: 'prod1',
          name: 'Zeolite Pure',
          category: 'Detox',
          description: 'Natural mineral for heavy metal detoxification',
          dosage: '3 drops, 3 times daily',
          frequency: 'Daily',
          phases: [1, 3]
        },
        {
          _id: 'prod2',
          name: 'Fulvic Acid Complex',
          category: 'Detox',
          description: 'Supports cellular detoxification and mineral absorption',
          dosage: '10 drops in water',
          frequency: 'Twice daily',
          phases: [1, 2, 3, 4]
        },
        {
          _id: 'prod3',
          name: 'Mitochondrial Support Formula',
          category: 'Mitochondrial',
          description: 'Blend of CoQ10, PQQ, and other mitochondrial nutrients',
          dosage: '2 capsules',
          frequency: 'Morning with food',
          phases: [2, 4]
        },
        {
          _id: 'prod4',
          name: 'Bioactive Carbon',
          category: 'Detox',
          description: 'Carbon-based binder for toxin elimination',
          dosage: '2 capsules',
          frequency: 'Twice daily, away from food',
          phases: [1, 3]
        },
        {
          _id: 'prod5',
          name: 'Liposomal Glutathione',
          category: 'Antioxidant',
          description: 'Master antioxidant for detoxification support',
          dosage: '1 teaspoon',
          frequency: 'Daily on empty stomach',
          phases: [1, 2, 3]
        },
        {
          _id: 'prod6',
          name: 'Molecular Hydrogen',
          category: 'Mitochondrial',
          description: 'Supports cellular energy and reduces oxidative stress',
          dosage: '1 tablet in 16oz water',
          frequency: 'Twice daily',
          phases: [2, 4]
        },
        {
          _id: 'prod7',
          name: 'Binder Blend',
          category: 'Detox',
          description: 'Multiple binders for comprehensive toxin removal',
          dosage: '2 capsules',
          frequency: 'Before bed on empty stomach',
          phases: [1, 3]
        },
        {
          _id: 'prod8',
          name: 'Methylation Support',
          category: 'Metabolic',
          description: 'B vitamins and nutrients for proper methylation',
          dosage: '1 capsule',
          frequency: 'Daily with food',
          phases: [2, 3, 4]
        }
      ]
      
      setProducts(mockProducts)
      setIsLoading(false)
    }
  }, [isLoading])

  const handleProductToggle = (productId: string) => {
    if (selectedProducts.includes(productId)) {
      onUpdateProducts(selectedProducts.filter(id => id !== productId))
    } else {
      onUpdateProducts([...selectedProducts, productId])
    }
  }

  const handleSelectAllInCategory = (category: string) => {
    const productsInCategory = products
      .filter(p => category === 'all' || p.category === category)
      .map(p => p._id)
    
    const allSelected = productsInCategory.every(id => selectedProducts.includes(id))
    
    if (allSelected) {
      // Deselect all in category
      onUpdateProducts(selectedProducts.filter(id => !productsInCategory.includes(id)))
    } else {
      // Select all in category
      const newSelected = Array.from(new Set([...selectedProducts, ...productsInCategory]))
      onUpdateProducts(newSelected)
    }
  }

  // Filter products by search and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter
    
    if (currentTab === 'recommended') {
      // First phase products for recommended tab
      return matchesSearch && matchesCategory && product.phases.includes(1)
    }
    
    return matchesSearch && matchesCategory
  })

  // Get unique categories from products
  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))]

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-medical-blue-800">Select Your Products</h2>
        <p className="text-gray-600">
          Choose the products you'll be using during your bioelectric regeneration protocol.
          You can modify these selections at any time.
        </p>
      </div>

      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="recommended">Recommended Products</TabsTrigger>
          <TabsTrigger value="all">All Products</TabsTrigger>
        </TabsList>
        
        <div className="flex flex-col sm:flex-row gap-4 my-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search products..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="recommended" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-medical-blue-700">
              Recommended for Phase 1: Terrain Clearing
            </h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleSelectAllInCategory(categoryFilter)}
            >
              {filteredProducts.every(p => selectedProducts.includes(p._id))
                ? 'Deselect All'
                : 'Select All'}
            </Button>
          </div>
          
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {filteredProducts.length > 0 ? (
                filteredProducts.map(product => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    isSelected={selectedProducts.includes(product._id)}
                    onToggle={() => handleProductToggle(product._id)}
                  />
                ))
              ) : (
                <div className="text-center p-6 text-gray-500">
                  No products found matching your criteria
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="all" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-medical-blue-700">
              All Available Products
            </h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleSelectAllInCategory(categoryFilter)}
            >
              {filteredProducts.every(p => selectedProducts.includes(p._id))
                ? 'Deselect All'
                : 'Select All'}
            </Button>
          </div>
          
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {filteredProducts.length > 0 ? (
                filteredProducts.map(product => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    isSelected={selectedProducts.includes(product._id)}
                    onToggle={() => handleProductToggle(product._id)}
                  />
                ))
              ) : (
                <div className="text-center p-6 text-gray-500">
                  No products found matching your criteria
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <div className="bg-medical-green-50 p-4 rounded-lg border border-medical-green-100">
        <div className="flex items-start">
          <div className="mr-3 mt-1 text-medical-green-600">
            <Check className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-medium text-medical-green-800 mb-1">Selected Products: {selectedProducts.length}</h3>
            <p className="text-sm text-medical-green-700">
              You've selected {selectedProducts.length} products for your protocol. These will be added to your 
              dashboard for daily tracking. You can easily add or remove products at any time.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProductCard({ 
  product, 
  isSelected, 
  onToggle 
}: { 
  product: Product, 
  isSelected: boolean, 
  onToggle: () => void 
}) {
  return (
    <Card className={`border transition-all ${isSelected ? 'border-medical-blue-300 bg-medical-blue-50' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start">
          <Checkbox 
            id={`product-${product._id}`} 
            checked={isSelected}
            onCheckedChange={onToggle}
            className="mt-1 mr-3"
          />
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <Label 
                htmlFor={`product-${product._id}`}
                className="font-medium text-medical-blue-800 cursor-pointer"
              >
                {product.name}
              </Label>
              <Badge variant="outline" className="ml-2">
                {product.category}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mt-1">{product.description}</p>
            <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-gray-600">
              <div>
                <span className="text-gray-500">Dosage:</span> {product.dosage}
              </div>
              <div>
                <span className="text-gray-500">Frequency:</span> {product.frequency}
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              {product.phases.map(phase => (
                <Badge 
                  key={phase} 
                  variant="secondary"
                  className="text-xs"
                >
                  Phase {phase}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
