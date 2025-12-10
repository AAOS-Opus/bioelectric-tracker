import React, { useState, useEffect, useRef } from 'react';
import { calculateContrastRatio, meetsContrastStandard, ColorPalette, getThemePalette } from '../utils/theme-utils';
import styles from './ThemeInspector.module.css';

interface ColorSwatch {
  name: string;
  value: string;
  foreground?: string;
}

interface ContrastResult {
  ratio: number;
  meetsAA: boolean;
  meetsAAA: boolean;
  foreground: string;
  background: string;
}

export function ThemeInspector() {
  const [activeTheme, setActiveTheme] = useState<'light' | 'dark'>('light');
  const [selectedColor, setSelectedColor] = useState<ColorSwatch | null>(null);
  const [contrastResults, setContrastResults] = useState<ContrastResult[]>([]);
  const [showAccessibility, setShowAccessibility] = useState(false);

  const palette = getThemePalette(activeTheme);

  // Flatten palette into color swatches
  const getColorSwatches = (palette: ColorPalette): ColorSwatch[] => {
    const swatches: ColorSwatch[] = [];
    
    // Core colors
    swatches.push(
      { name: 'Background', value: palette.background },
      { name: 'Surface', value: palette.surface },
      { name: 'Surface Hover', value: palette.surfaceHover },
      { name: 'Surface Active', value: palette.surfaceActive }
    );

    // Brand colors
    swatches.push(
      { name: 'Primary', value: palette.primary, foreground: palette.primaryForeground },
      { name: 'Primary Hover', value: palette.primaryHover, foreground: palette.primaryForeground },
      { name: 'Primary Active', value: palette.primaryActive, foreground: palette.primaryForeground },
      { name: 'Secondary', value: palette.secondary, foreground: palette.secondaryForeground },
      { name: 'Secondary Hover', value: palette.secondaryHover, foreground: palette.secondaryForeground },
      { name: 'Secondary Active', value: palette.secondaryActive, foreground: palette.secondaryForeground }
    );

    // Text colors
    swatches.push(
      { name: 'Text Primary', value: palette.text.primary },
      { name: 'Text Secondary', value: palette.text.secondary },
      { name: 'Text Disabled', value: palette.text.disabled },
      { name: 'Text Placeholder', value: palette.text.placeholder }
    );

    // Medical colors
    swatches.push(
      { name: 'Medical Blue', value: palette.medical.blue },
      { name: 'Medical Green', value: palette.medical.green },
      { name: 'Medical Teal', value: palette.medical.teal },
      { name: 'Medical Purple', value: palette.medical.purple }
    );

    // Status colors
    swatches.push(
      { name: 'Error', value: palette.status.error },
      { name: 'Warning', value: palette.status.warning },
      { name: 'Success', value: palette.status.success },
      { name: 'Info', value: palette.status.info }
    );

    // Border colors
    swatches.push(
      { name: 'Border', value: palette.border },
      { name: 'Border Hover', value: palette.borderHover }
    );

    return swatches;
  };

  const colorSwatches = getColorSwatches(palette);

  // Calculate contrast ratios when a color is selected
  useEffect(() => {
    if (!selectedColor) {
      setContrastResults([]);
      return;
    }

    const results = colorSwatches.map(swatch => {
      const ratio = calculateContrastRatio(selectedColor.value, swatch.value);
      return {
        ratio,
        meetsAA: meetsContrastStandard(ratio, 'AA'),
        meetsAAA: meetsContrastStandard(ratio, 'AAA'),
        foreground: selectedColor.value,
        background: swatch.value
      };
    });

    setContrastResults(results.sort((a, b) => b.ratio - a.ratio));
  }, [selectedColor, colorSwatches]);

  // Helper to determine text color class based on background
  const getTextColorClass = (backgroundColor: string) => {
    return calculateContrastRatio(backgroundColor, '#FFFFFF') > 4.5 
      ? styles.textDark 
      : styles.textLight;
  };

  return (
    <div className={`${styles.themeInspector} p-4 bg-surface rounded-lg shadow-md`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Theme Inspector</h2>
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTheme(activeTheme === 'light' ? 'dark' : 'light')}
            className="px-3 py-1 rounded-md bg-primary text-primary-foreground"
          >
            Toggle Theme
          </button>
          <button
            onClick={() => setShowAccessibility(!showAccessibility)}
            className="px-3 py-1 rounded-md bg-secondary text-secondary-foreground"
          >
            {showAccessibility ? 'Hide' : 'Show'} Accessibility
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className={styles.sectionTitle}>Color Palette</h3>
          <div className="grid grid-cols-2 gap-2">
            {colorSwatches.map((swatch) => {
              const textClass = swatch.foreground ? undefined : getTextColorClass(swatch.value);
              
              return (
                <ColorSwatchItem 
                  key={swatch.name}
                  swatch={swatch}
                  isSelected={selectedColor?.name === swatch.name}
                  onClick={() => setSelectedColor(swatch)}
                  textClass={textClass}
                />
              );
            })}
          </div>
        </div>

        {showAccessibility && (
          <div>
            <h3 className={styles.sectionTitle}>Contrast Analysis</h3>
            {selectedColor ? (
              <div className="space-y-2">
                <div className="text-sm mb-4">
                  Selected: <span className="font-medium">{selectedColor.name}</span>
                </div>
                {contrastResults.map((result, index) => {
                  const textClass = getTextColorClass(result.background);
                  
                  return (
                    <ContrastResultItem
                      key={index}
                      result={result}
                      textClass={textClass}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="text-sm text-secondary">
                Select a color to see contrast analysis
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface ColorSwatchItemProps {
  swatch: ColorSwatch;
  isSelected: boolean;
  onClick: () => void;
  textClass?: string;
}

function ColorSwatchItem({ swatch, isSelected, onClick, textClass }: ColorSwatchItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!ref.current) return;
    
    const element = ref.current;
    element.style.setProperty('--swatch-bg-color', swatch.value);
    element.style.setProperty('--swatch-text-color', swatch.foreground || '');
  }, [swatch]);
  
  return (
    <div
      ref={ref}
      onClick={onClick}
      className={`${styles.colorSwatch} ${isSelected ? styles.selectedSwatch : ''} ${textClass || ''}`}
    >
      <div className={styles.swatchName}>{swatch.name}</div>
      <div className={styles.swatchValue}>{swatch.value}</div>
    </div>
  );
}

interface ContrastResultItemProps {
  result: ContrastResult;
  textClass?: string;
}

function ContrastResultItem({ result, textClass }: ContrastResultItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!ref.current) return;
    
    const element = ref.current;
    element.style.setProperty('--contrast-bg-color', result.background);
    element.style.setProperty('--contrast-text-color', result.foreground);
  }, [result]);
  
  return (
    <div
      ref={ref}
      className={`${styles.contrastItem} ${textClass || ''}`}
    >
      <div className={styles.contrastText}>
        Ratio: {result.ratio.toFixed(2)}:1
        {result.meetsAAA && ' ✓✓✓'}
        {result.meetsAA && !result.meetsAAA && ' ✓✓'}
        {!result.meetsAA && ' ✗'}
      </div>
    </div>
  );
}
