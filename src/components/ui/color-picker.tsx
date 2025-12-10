"use client"

import * as React from "react"
import { Paintbrush } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { Button } from "./button"
import styles from "./color-picker.module.css"

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
  className?: string
}

// Define a set of medical-themed color swatches
const presetColors = [
  // Blues (medical theme)
  "#0284c7", "#0369a1", "#075985", "#0c4a6e",
  // Greens (healing)
  "#059669", "#047857", "#065f46", "#064e3b",
  // Reds (important)
  "#dc2626", "#b91c1c", "#991b1b", "#7f1d1d",
  // Purples (soothing)
  "#7c3aed", "#6d28d9", "#5b21b6", "#4c1d95",
  // Teals (sterile)
  "#0d9488", "#0f766e", "#115e59", "#134e4a",
  // Neutral tones
  "#737373", "#525252", "#404040", "#262626",
]

export function ColorPicker({ color, onChange, className = "" }: ColorPickerProps) {
  const [currentColor, setCurrentColor] = React.useState(color)

  React.useEffect(() => {
    if (color !== currentColor) {
      setCurrentColor(color)
    }
  }, [color])

  React.useEffect(() => {
    // Set the background color for elements with data-color attributes
    document.querySelectorAll('[data-color]').forEach((el) => {
      const color = el.getAttribute('data-color');
      if (color) {
        (el as HTMLElement).style.backgroundColor = color;
      }
    });
  }, [currentColor]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentColor(e.target.value)
    onChange(e.target.value)
  }

  const handlePresetClick = (preset: string) => {
    setCurrentColor(preset)
    onChange(preset)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className={`${styles.triggerButton} ${className}`}
          data-color={currentColor} 
          aria-label="Pick a color"
          title="Pick a color"
        >
          <span className="sr-only">Pick a color</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className={styles.popoverContent}>
        <div className={styles.colorPickerContainer}>
          <div className={styles.colorPresets}>
            {presetColors.map((presetColor) => (
              <button
                key={presetColor}
                type="button"
                className={`${styles.colorSwatch} ${presetColor.toLowerCase() === currentColor ? styles.selectedSwatch : ''}`}
                data-color={presetColor} 
                onClick={() => handlePresetClick(presetColor)}
                aria-label={`Select color: ${presetColor}`}
                title={`Select color: ${presetColor}`}
              />
            ))}
          </div>
          <div className={styles.inputContainer}>
            <div 
              className={styles.colorPreview}
              data-color={currentColor} 
              aria-hidden="true"
            />
            <input
              type="text"
              value={currentColor}
              onChange={handleChange}
              className={styles.colorInput}
              aria-label="Color value"
              placeholder="Enter color hex value"
            />
            <input
              type="color"
              value={currentColor}
              onChange={handleChange}
              className={styles.colorPickerInput}
              aria-label="Color picker"
              title="Choose a color"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { ColorPicker as default }
