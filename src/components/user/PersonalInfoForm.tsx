'use client'

import React, { useState, useEffect } from 'react'
import { User } from '@/types/user'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, User as UserIcon, Upload } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { toast } from '@/components/ui/use-toast'

interface PersonalInfoFormProps {
  user: User;
  onUpdate: (updatedValues: Partial<User>) => void;
}

// Add validation schema
const personalInfoSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phoneNumber: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  height: z.string().optional(),
  weight: z.string().optional(),
  bloodType: z.string().optional(),
  bio: z.string().optional(),
})

type PersonalInfoFormValues = z.infer<typeof personalInfoSchema>

export default function PersonalInfoForm({ user, onUpdate }: PersonalInfoFormProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(user.profileImage || null)
  
  const form = useForm<PersonalInfoFormValues>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      name: user.name || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      dateOfBirth: user.dateOfBirth || '',
      gender: user.gender || '',
      height: user.height ? String(user.height) : '',
      weight: user.weight ? String(user.weight) : '',
      bloodType: user.bloodType || '',
      bio: user.bio || ''
    }
  })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a JPEG, PNG, or GIF image.',
        variant: 'destructive',
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 5MB.',
        variant: 'destructive',
      })
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      // Create a local preview
      const reader = new FileReader()
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string)
      }
      reader.readAsDataURL(file)

      // Upload to server
      const formData = new FormData()
      formData.append('profileImage', file)
      
      const response = await fetch('/api/user/profile-image', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to upload image')
      }

      toast({
        title: 'Image uploaded',
        description: 'Your profile image has been updated.',
      })
    } catch (err: any) {
      setError(err.message || 'Failed to upload image')
      setImagePreview(user.profileImage || null)
      toast({
        title: 'Upload failed',
        description: err.message || 'There was an error uploading your image.',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
    }
  }

  const onSubmit = async (values: PersonalInfoFormValues) => {
    setIsSaving(true)
    setError(null)
    
    try {
      // Convert string values to numbers where needed
      const updatedValues: Partial<User> = {
        ...values,
        height: values.height ? Number(values.height) : undefined,
        weight: values.weight ? Number(values.weight) : undefined,
      }
      
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedValues),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile')
      }

      onUpdate(updatedValues)
      
      toast({
        title: 'Profile updated',
        description: 'Your personal information has been updated successfully.',
      })
    } catch (err: any) {
      setError(err.message || 'Failed to update profile')
      toast({
        title: 'Update failed',
        description: err.message || 'There was an error updating your profile.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Update your personal details and how we can contact you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-1">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name"
                {...form.register('name')}
                aria-invalid={!!form.formState.errors.name}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
              )}
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email"
                type="email"
                {...form.register('email')}
                aria-invalid={!!form.formState.errors.email}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
              )}
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input 
                id="phoneNumber"
                type="tel"
                {...form.register('phoneNumber')}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input 
                id="dateOfBirth"
                type="date"
                {...form.register('dateOfBirth')}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="gender">Gender</Label>
              <Select 
                onValueChange={(value) => form.setValue('gender', value)}
                defaultValue={form.getValues('gender')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="non-binary">Non-binary</SelectItem>
                  <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
              <CardDescription>
                Upload a profile picture to personalize your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-32 w-32">
                  {imagePreview ? (
                    <AvatarImage src={imagePreview} alt={user.name} />
                  ) : (
                    <AvatarFallback>{user.name?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                  )}
                </Avatar>
                
                <div>
                  <Label 
                    htmlFor="profilePicture"
                    className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {isUploading ? (
                      <>
                        <LoadingSpinner className="mr-2" size="sm" />
                        Uploading...
                      </>
                    ) : (
                      'Choose Image'
                    )}
                  </Label>
                  <Input 
                    id="profilePicture"
                    type="file"
                    accept="image/jpeg,image/png,image/gif"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    JPEG, PNG or GIF. Max 5MB.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Health Information</CardTitle>
              <CardDescription>
                Optional health details to personalize your experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input 
                    id="height"
                    type="number"
                    {...form.register('height')}
                  />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input 
                    id="weight"
                    type="number"
                    {...form.register('weight')}
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="bloodType">Blood Type</Label>
                <Select 
                  onValueChange={(value) => form.setValue('bloodType', value)}
                  defaultValue={form.getValues('bloodType')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select blood type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
                    <SelectItem value="unknown">Don't know</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="bio">Bio / Health Background</Label>
                <Textarea 
                  id="bio"
                  placeholder="Share relevant health history or conditions..."
                  className="min-h-[100px]"
                  {...form.register('bio')}
                />
                <p className="text-xs text-gray-500">
                  {form.watch('bio')?.length || 0}/500 characters
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-6 flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={() => form.reset()}>
          Reset
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? (
            <>
              <LoadingSpinner className="mr-2" size="sm" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </form>
  )
}
