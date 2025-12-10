'use client'

import { useState, useEffect } from 'react'
import { usePreferences } from '@/contexts/PreferencesContext'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle,
  Label,
  RadioGroup, 
  RadioGroupItem,
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
  Switch,
  Separator,
  Slider,
  Input,
  Button
} from '@/components/ui'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Clock, Moon, PaintBucket, Palette, Sun, Type } from 'lucide-react'
import { ThemeOption, FontFamily, DEFAULT_THEME_SETTINGS } from '@/types/preferences'
import styles from './ThemeSettings.module.css'

interface ThemeSettingsProps {
  onSettingChange: (setting: string) => void
}

export default function ThemeSettings({ onSettingChange }: ThemeSettingsProps) {
  const { preferences, setPreference } = usePreferences()
  const { theme } = preferences
  
  // Use type assertion to ensure we can access all the properties we need
  const themeSettings = typeof theme === 'object' ? theme : DEFAULT_THEME_SETTINGS
  
  const [themePreview, setThemePreview] = useState<ThemeOption>(
    typeof theme === 'string' ? theme : themeSettings.current || 'system'
  )
  const [scheduleEnabled, setScheduleEnabled] = useState<boolean>(
    typeof theme === 'object' ? themeSettings.scheduleEnabled || false : false
  )
  const [previewMode, setPreviewMode] = useState<'light' | 'dark'>('light')
  const [fontScale, setFontScale] = useState<number>(
    typeof theme === 'object' ? themeSettings.fontScale || 1 : 1
  )
  
  // Time picker for scheduled themes
  const [lightStart, setLightStart] = useState<string>(
    typeof theme === 'object' ? themeSettings.lightModeStartTime || '07:00' : '07:00'
  )
  const [darkStart, setDarkStart] = useState<string>(
    typeof theme === 'object' ? themeSettings.darkModeStartTime || '19:00' : '19:00'
  )

  // Font settings
  const [selectedFont, setSelectedFont] = useState<FontFamily>(
    typeof theme === 'object' ? themeSettings.fontFamily || 'system' : 'system'
  )
  
  // Color scheme settings
  const [primaryColor, setPrimaryColor] = useState<string>(
    typeof theme === 'object' ? themeSettings.primaryColor || '#1e40af' : '#1e40af'
  )
  const [secondaryColor, setSecondaryColor] = useState<string>(
    typeof theme === 'object' ? themeSettings.secondaryColor || '#047857' : '#047857'
  )
  const [accentColor, setAccentColor] = useState<string>(
    typeof theme === 'object' ? themeSettings.accentColor || '#6d28d9' : '#6d28d9'
  )

  // Update CSS variables when colors change
  useEffect(() => {
    // Set CSS variables for the theme preview
    document.documentElement.style.setProperty('--primary-color', primaryColor);
    document.documentElement.style.setProperty('--secondary-color', secondaryColor);
    document.documentElement.style.setProperty('--accent-color', accentColor);
    document.documentElement.style.setProperty('--font-family', selectedFont);
    document.documentElement.style.setProperty('--font-scale', fontScale.toString());
    
    // Set background colors for elements with data-color attributes
    document.querySelectorAll('[data-color]').forEach((el) => {
      const color = el.getAttribute('data-color');
      if (color) {
        (el as HTMLElement).style.backgroundColor = color;
      }
    });
  }, [primaryColor, secondaryColor, accentColor, selectedFont, fontScale]);

  // Save theme updates - handle string or object theme gracefully
  const updateTheme = (key: string, value: any) => {
    if (typeof theme === 'string') {
      // Convert from simple string theme to object
      setPreference('theme', {
        ...DEFAULT_THEME_SETTINGS,
        current: theme,
        [key]: value
      })
    } else {
      // Object theme - just update the property
      setPreference('theme', {
        ...theme,
        [key]: value
      })
    }
    onSettingChange(`Updated ${key}`)
  }

  // Apply theme change
  const applyThemeChange = () => {
    // Always ensure we're working with a theme object
    const updatedTheme = typeof theme === 'object' ? { ...theme } : { ...DEFAULT_THEME_SETTINGS }
    
    // Update all theme properties
    updatedTheme.current = themePreview
    updatedTheme.scheduleEnabled = scheduleEnabled
    updatedTheme.lightModeStartTime = lightStart
    updatedTheme.darkModeStartTime = darkStart
    updatedTheme.fontFamily = selectedFont
    updatedTheme.fontScale = fontScale
    updatedTheme.primaryColor = primaryColor
    updatedTheme.secondaryColor = secondaryColor
    updatedTheme.accentColor = accentColor
    
    // Update in context
    setPreference('theme', updatedTheme)
    onSettingChange('Applied theme changes')
  }

  // Reset to defaults
  const resetToDefaults = () => {
    setThemePreview(DEFAULT_THEME_SETTINGS.current)
    setScheduleEnabled(DEFAULT_THEME_SETTINGS.scheduleEnabled)
    setLightStart(DEFAULT_THEME_SETTINGS.lightModeStartTime)
    setDarkStart(DEFAULT_THEME_SETTINGS.darkModeStartTime)
    setSelectedFont(DEFAULT_THEME_SETTINGS.fontFamily)
    setFontScale(DEFAULT_THEME_SETTINGS.fontScale)
    setPrimaryColor(DEFAULT_THEME_SETTINGS.primaryColor)
    setSecondaryColor(DEFAULT_THEME_SETTINGS.secondaryColor)
    setAccentColor(DEFAULT_THEME_SETTINGS.accentColor)
    
    setPreference('theme', DEFAULT_THEME_SETTINGS)
    onSettingChange('Reset to default theme')
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <PaintBucket className="h-5 w-5 text-primary" />
            <CardTitle>Theme Settings</CardTitle>
          </div>
          <CardDescription>
            Customize the appearance of your bioelectric regeneration tracker.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Theme Mode Selection */}
          <div>
            <h3 className="text-lg font-medium mb-4">Theme Mode</h3>
            <RadioGroup 
              defaultValue={typeof theme === 'string' ? theme : themeSettings.current || 'system'}
              onValueChange={(value: string) => {
                setThemePreview(value as ThemeOption)
                updateTheme('current', value)
              }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="light" id="theme-light" />
                <Label htmlFor="theme-light" className="flex items-center cursor-pointer">
                  <Sun className="h-4 w-4 mr-2" />
                  Light Mode
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dark" id="theme-dark" />
                <Label htmlFor="theme-dark" className="flex items-center cursor-pointer">
                  <Moon className="h-4 w-4 mr-2" />
                  Dark Mode
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="system" id="theme-system" />
                <Label htmlFor="theme-system" className="flex items-center cursor-pointer">
                  <PaintBucket className="h-4 w-4 mr-2" />
                  System Default
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          <Separator />
          
          {/* Scheduled Theme Options */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-0.5">
                <h3 className="text-lg font-medium">Scheduled Theme Changes</h3>
                <p className="text-sm text-muted-foreground">
                  Automatically switch between light and dark mode based on time
                </p>
              </div>
              <Switch 
                checked={scheduleEnabled} 
                onCheckedChange={(checked) => {
                  setScheduleEnabled(checked)
                  updateTheme('scheduleEnabled', checked)
                }} 
                aria-label="Enable scheduled theme changes"
              />
            </div>
            
            {scheduleEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Sun className="h-4 w-4" />
                    <Label htmlFor="light-mode-start">Light Mode Start</Label>
                  </div>
                  <Input 
                    id="light-mode-start" 
                    type="time" 
                    value={lightStart} 
                    onChange={(e) => {
                      setLightStart(e.target.value)
                      updateTheme('lightModeStartTime', e.target.value)
                    }}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Moon className="h-4 w-4" />
                    <Label htmlFor="dark-mode-start">Dark Mode Start</Label>
                  </div>
                  <Input 
                    id="dark-mode-start" 
                    type="time" 
                    value={darkStart} 
                    onChange={(e) => {
                      setDarkStart(e.target.value)
                      updateTheme('darkModeStartTime', e.target.value)
                    }}
                  />
                </div>
              </div>
            )}
          </div>
          
          <Separator />
          
          {/* Font Settings */}
          <div>
            <h3 className="text-lg font-medium mb-4">Typography</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="font-family">Font Family</Label>
                <Select 
                  value={selectedFont} 
                  onValueChange={(value: FontFamily) => {
                    setSelectedFont(value)
                    updateTheme('fontFamily', value)
                  }}
                >
                  <SelectTrigger id="font-family">
                    <SelectValue placeholder="Select font" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">System Default</SelectItem>
                    <SelectItem value="inter">Inter (Modern)</SelectItem>
                    <SelectItem value="serif">Serif (Traditional)</SelectItem>
                    <SelectItem value="sans-serif">Sans Serif (Clean)</SelectItem>
                    <SelectItem value="monospace">Monospace (Fixed-width)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="font-scale">Font Size Scale: {fontScale.toFixed(1)}x</Label>
                </div>
                <div className="pt-2">
                  <Slider 
                    id="font-scale"
                    min={0.8} 
                    max={1.5} 
                    step={0.1} 
                    value={[fontScale]} 
                    onValueChange={(value) => {
                      setFontScale(value[0])
                      updateTheme('fontScale', value[0])
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* Color Customization */}
          <div>
            <h3 className="text-lg font-medium mb-4">Color Palette</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Primary Color</Label>
                <div className="flex items-center space-x-2">
                  <div 
                    className={styles.colorSwatch}
                    data-color={primaryColor}
                  />
                  <Input 
                    type="text" 
                    value={primaryColor} 
                    onChange={(e) => {
                      setPrimaryColor(e.target.value)
                      updateTheme('primaryColor', e.target.value)
                    }}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Secondary Color</Label>
                <div className="flex items-center space-x-2">
                  <div 
                    className={styles.colorSwatch}
                    data-color={secondaryColor}
                  />
                  <Input 
                    type="text" 
                    value={secondaryColor} 
                    onChange={(e) => {
                      setSecondaryColor(e.target.value)
                      updateTheme('secondaryColor', e.target.value)
                    }}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Accent Color</Label>
                <div className="flex items-center space-x-2">
                  <div 
                    className={styles.colorSwatch}
                    data-color={accentColor}
                  />
                  <Input 
                    type="text" 
                    value={accentColor} 
                    onChange={(e) => {
                      setAccentColor(e.target.value)
                      updateTheme('accentColor', e.target.value)
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between border-t p-6 bg-slate-50 dark:bg-slate-950">
          <Button variant="outline" onClick={resetToDefaults}>
            Reset to Defaults
          </Button>
          <Button onClick={applyThemeChange}>
            Apply Changes
          </Button>
        </CardFooter>
      </Card>
      
      {/* Theme Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Theme Preview</CardTitle>
          <CardDescription>
            See how your customizations will look in your application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={previewMode} onValueChange={(value: string) => setPreviewMode(value as 'light' | 'dark')}>
            <TabsList className="mb-4">
              <TabsTrigger value="light">Light Mode</TabsTrigger>
              <TabsTrigger value="dark">Dark Mode</TabsTrigger>
            </TabsList>
            
            <TabsContent value="light" className="p-4 rounded-lg border">
              <div className={styles.previewLight}>
                <h3 className={styles.previewHeader}>
                  Sample Header
                </h3>
                <p className="mb-4">
                  This is a preview of how your theme settings will look. Text should be 
                  readable and match your chosen font family and scale.
                </p>
                <div className="flex space-x-2">
                  <Button className={styles.previewPrimaryBtn}>
                    Primary Button
                  </Button>
                  <Button 
                    variant="outline" 
                    className={styles.previewSecondaryBtn}
                  >
                    Secondary
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="dark" className="p-4 rounded-lg border">
              <div className={styles.previewDark}>
                <h3 className={styles.previewHeader}>
                  Sample Header
                </h3>
                <p className="mb-4">
                  This is a preview of how your dark theme settings will look. Text should be 
                  readable and match your chosen font family and scale.
                </p>
                <div className="flex space-x-2">
                  <Button className={styles.previewPrimaryBtn}>
                    Primary Button
                  </Button>
                  <Button 
                    variant="outline" 
                    className={styles.previewSecondaryBtn}
                  >
                    Secondary
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
