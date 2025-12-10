'use client'

import React, { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, Edit, Plus, Save, UploadCloud, Download, Trash2, RefreshCw } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from '@/components/ui/use-toast'
import { ProductPhaseAssociations } from './ProductPhaseAssociations'
import { ImportExportModal } from './ImportExportModal'

// Schema for product validation
const productSchema = z.object({
  name: z.string().min(2, { message: "Product name must be at least 2 characters" }),
  category: z.string().min(1, { message: "Category is required" }),
  description: z.string().optional(),
  dosage: z.string().optional(),
  frequency: z.string().optional(),
  unit: z.string().optional(),
  notes: z.string().optional(),
  active: z.boolean().default(true)
});

type ProductFormValues = z.infer<typeof productSchema>;

interface Product {
  _id: string;
  name: string;
  category: string;
  description?: string;
  dosage?: string;
  frequency?: string;
  unit?: string;
  notes?: string;
  active: boolean;
  phaseAssociations?: {
    phaseId: string;
    dosage?: string;
    frequency?: string;
    notes?: string;
  }[];
}

interface Phase {
  _id: string;
  name: string;
  order: number;
  color?: string;
}

export function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [categories, setCategories] = useState<string[]>(['Detox', 'Mitochondrial', 'Mineral', 'Immune']);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const { 
    register, 
    handleSubmit, 
    reset, 
    setValue,
    control, 
    formState: { errors } 
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      category: '',
      description: '',
      dosage: '',
      frequency: '',
      unit: '',
      notes: '',
      active: true
    }
  });

  // Fetch products, phases, and categories on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // In a real app, these would be API calls
        // Example placeholder data
        const productsData = [
          { 
            _id: '1', 
            name: 'Liver Sauce', 
            category: 'Detox', 
            description: 'Liposomal blend for liver support',
            dosage: '5',
            frequency: 'Twice daily',
            unit: 'mL',
            notes: 'Take 30 minutes before meals',
            active: true 
          },
          { 
            _id: '2', 
            name: 'PushCatch', 
            category: 'Detox', 
            description: 'Two-part system with binder complex',
            dosage: '5',
            frequency: 'Twice daily',
            unit: 'mL',
            notes: 'Take on empty stomach',
            active: true 
          },
          { 
            _id: '3', 
            name: 'NAD+ Platinum', 
            category: 'Mitochondrial', 
            description: 'Advanced liposomal NAD+ formula',
            dosage: '2',
            frequency: 'Twice daily',
            unit: 'mL',
            notes: 'Best taken in morning and early afternoon',
            active: true 
          }
        ];
        
        const phasesData = [
          { _id: '1', name: 'Terrain Clearing', order: 1, color: '#4ade80' },
          { _id: '2', name: 'Mitochondrial Rebuild', order: 2, color: '#60a5fa' },
          { _id: '3', name: 'Heavy Metal Liberation', order: 3, color: '#f97316' },
          { _id: '4', name: 'Biofield Expansion', order: 4, color: '#8b5cf6' }
        ];
        
        setProducts(productsData);
        setPhases(phasesData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load products and phases',
          variant: 'destructive'
        });
      }
    };

    fetchData();
  }, []);

  const onAddProduct = async (data: ProductFormValues) => {
    try {
      // In a real app, this would be an API call
      const newProduct = {
        _id: Date.now().toString(), // Placeholder ID
        ...data
      };
      
      setProducts([...products, newProduct]);
      setIsAddOpen(false);
      reset();
      
      toast({
        title: 'Success',
        description: `${data.name} has been added`,
        variant: 'default'
      });
    } catch (error) {
      console.error('Error adding product:', error);
      toast({
        title: 'Error',
        description: 'Failed to add product',
        variant: 'destructive'
      });
    }
  };

  const onEditProduct = async (data: ProductFormValues) => {
    if (!currentProduct) return;
    
    try {
      // In a real app, this would be an API call
      const updatedProducts = products.map(product => 
        product._id === currentProduct._id
          ? { ...product, ...data }
          : product
      );
      
      setProducts(updatedProducts);
      setIsEditOpen(false);
      setCurrentProduct(null);
      
      toast({
        title: 'Success',
        description: `${data.name} has been updated`,
        variant: 'default'
      });
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: 'Error',
        description: 'Failed to update product',
        variant: 'destructive'
      });
    }
  };

  const handleToggleActive = async (productId: string, newActiveState: boolean) => {
    try {
      // In a real app, this would be an API call
      const updatedProducts = products.map(product => 
        product._id === productId
          ? { ...product, active: newActiveState }
          : product
      );
      
      setProducts(updatedProducts);
      
      toast({
        title: 'Success',
        description: `Product ${newActiveState ? 'activated' : 'deactivated'}`,
        variant: 'default'
      });
    } catch (error) {
      console.error('Error toggling product active state:', error);
      toast({
        title: 'Error',
        description: 'Failed to update product',
        variant: 'destructive'
      });
    }
  };

  const handleEditClick = (product: Product) => {
    setCurrentProduct(product);
    
    // Set form values
    setValue('name', product.name);
    setValue('category', product.category);
    setValue('description', product.description || '');
    setValue('dosage', product.dosage || '');
    setValue('frequency', product.frequency || '');
    setValue('unit', product.unit || '');
    setValue('notes', product.notes || '');
    setValue('active', product.active);
    
    setIsEditOpen(true);
  };

  const handleAddCategory = (newCategory: string) => {
    if (newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
    }
  };

  const filteredProducts = products
    .filter(product => filterCategory === 'all' || product.category === filterCategory)
    .filter(product => filterActive === null || product.active === filterActive)
    .filter(product => 
      searchTerm === '' || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Product Management</h2>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setIsImportExportOpen(true)}>
            <UploadCloud className="mr-2 h-4 w-4" />
            Import/Export
          </Button>
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>
      
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Filter Products</CardTitle>
          <CardDescription className="text-muted-foreground">Use the filters below to find specific products</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="category-filter" className="text-foreground">Category</Label>
              <Select
                value={filterCategory}
                onValueChange={(value) => setFilterCategory(value)}
              >
                <SelectTrigger id="category-filter" className="bg-card border-input">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="active-filter" className="text-foreground">Status</Label>
              <Select
                value={filterActive === null ? 'all' : filterActive ? 'active' : 'inactive'}
                onValueChange={(value) => {
                  if (value === 'all') setFilterActive(null);
                  else setFilterActive(value === 'active');
                }}
              >
                <SelectTrigger id="active-filter" className="bg-card border-input">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="search" className="text-foreground">Search</Label>
              <Input
                id="search"
                placeholder="Search by name or description"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-card border-input text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-foreground">Products</CardTitle>
            <CardDescription className="text-muted-foreground">
              Manage your bioelectric regeneration products
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <ImportExportModal 
              isOpen={isImportExportOpen}
              onClose={() => setIsImportExportOpen(false)}
              onImport={(data) => {
                console.log('Imported data:', data);
                toast({
                  title: 'Import Successful',
                  description: `${data.length} products imported`,
                  variant: 'default'
                });
              }}
              exportData={products}
              type="products"
            />
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="default" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Add New Product</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Fill in the details for the new product
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onAddProduct)} className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-foreground">Name</Label>
                    <Input
                      id="name"
                      {...register('name')}
                      className="bg-card border-input text-foreground"
                    />
                    {errors.name && (
                      <p className="text-destructive text-sm mt-1">{errors.name.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="category" className="text-foreground">Category</Label>
                    <Controller
                      name="category"
                      control={control}
                      render={({ field }) => (
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger className="bg-card border-input">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category} value={category}>{category}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.category && (
                      <p className="text-destructive text-sm mt-1">{errors.category.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-foreground">Description</Label>
                    <Textarea
                      id="description"
                      {...register('description')}
                      className="bg-card border-input text-foreground"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dosage" className="text-foreground">Dosage</Label>
                      <Input
                        id="dosage"
                        {...register('dosage')}
                        className="bg-card border-input text-foreground"
                      />
                    </div>
                    <div>
                      <Label htmlFor="frequency" className="text-foreground">Frequency</Label>
                      <Input
                        id="frequency"
                        {...register('frequency')}
                        className="bg-card border-input text-foreground"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes" className="text-foreground">Notes</Label>
                    <Textarea
                      id="notes"
                      {...register('notes')}
                      className="bg-card border-input text-foreground"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="active"
                      {...register('active')}
                      className="border-input"
                    />
                    <Label htmlFor="active" className="text-foreground">Active</Label>
                  </div>

                  <DialogFooter>
                    <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
                      Add Product
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredProducts.map((product) => (
              <Card key={product._id} className="bg-card border-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-semibold text-foreground">{product.name}</h3>
                      <Badge variant={product.active ? 'default' : 'secondary'} className="ml-2">
                        {product.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditClick(product)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit product</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <Switch
                        checked={product.active}
                        onCheckedChange={(checked) => handleToggleActive(product._id, checked)}
                        className="data-[state=checked]:bg-primary"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Category</p>
                      <p className="text-foreground">{product.category}</p>
                    </div>
                    {product.description && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Description</p>
                        <p className="text-foreground">{product.description}</p>
                      </div>
                    )}
                    {product.dosage && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Dosage</p>
                        <p className="text-foreground">{product.dosage} {product.unit}</p>
                      </div>
                    )}
                    {product.frequency && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Frequency</p>
                        <p className="text-foreground">{product.frequency}</p>
                      </div>
                    )}
                    {product.notes && (
                      <div className="col-span-2">
                        <p className="text-sm font-medium text-muted-foreground">Notes</p>
                        <p className="text-foreground">{product.notes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
