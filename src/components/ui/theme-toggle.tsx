'use client'

import * as React from 'react'
import { Moon, Sun, Laptop } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { usePreferences } from '@/contexts/PreferencesContext'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const { setPreference } = usePreferences()

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    // Update both the next-themes context and preferences
    setTheme(newTheme)
    // Save to preferences context for persistence
    setPreference('theme', newTheme)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className="h-10 w-10 bg-background border-border hover:bg-accent hover:text-accent-foreground"
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all text-foreground dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all text-foreground dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-background border-border">
        <DropdownMenuItem 
          onClick={() => handleThemeChange('light')}
          className="text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer"
        >
          <Sun className="mr-2 h-4 w-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleThemeChange('dark')}
          className="text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer"
        >
          <Moon className="mr-2 h-4 w-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleThemeChange('system')}
          className="text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer"
        >
          <Laptop className="mr-2 h-4 w-4" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
