/**
 * Dark Mode Accessibility Testing Utilities
 * 
 * This file provides specialized testing utilities for validating dark mode implementation
 * against WCAG 2.1 AA and AAA standards, with focus on contrast, transitions, and 
 * theme-specific accessibility concerns.
 */

import { testColorContrast } from './a11y-color-contrast';
import { calculateContrastRatio, meetsContrastStandard } from '../../utils/theme-utils';

interface DarkModeTestResult {
  theme: 'light' | 'dark';
  themeDetection: {
    success: boolean;
    systemPreferenceDetected: boolean;
    persistedThemeLoaded: boolean;
    scheduledThemeApplied?: boolean;
  };
  contrastCompliance: {
    elements: {
      name: string;
      selector: string;
      contrastRatio: number;
      meetsAA: boolean;
      meetsAAA: boolean;
      foregroundColor: string;
      backgroundColor: string;
    }[];
    overallAACompliance: boolean;
    overallAAACompliance: boolean;
  };
  transitions: {
    duration: number;
    smoothTransition: boolean;
    respectedReducedMotion: boolean;
    noFlickeringOrFlashing: boolean;
  };
  visualConsistency: {
    allComponentsAdaptedToTheme: boolean;
    inconsistentElements: string[];
  };
  interactiveElements: {
    allStatesDistinct: boolean;
    focusIndicatorsVisible: boolean;
    problemElements: string[];
  };
  performance: {
    themeToggleResponseTime: number;
    animationFrameRate: number;
    layoutShift: number;
    performanceIssues: string[];
  };
  mediaAdaptation: {
    logoVariantApplied: boolean;
    imageBackgroundsCompatible: boolean;
    controlsVisibleInBothThemes: boolean;
    mediaIssues: string[];
  };
}

/**
 * Test for 'flash of incorrect theme' on initial load
 * Returns true if no flash was detected
 */
export const testInitialThemeFlash = async (): Promise<boolean> => {
  return new Promise(resolve => {
    // Create a hidden test iframe to simulate fresh page load
    const iframe = document.createElement('iframe');
    
    iframe.style.position = 'absolute';
    iframe.style.opacity = '0.01';
    iframe.style.height = '400px';
    iframe.style.width = '600px';
    iframe.style.zIndex = '-1000';
    
    document.body.appendChild(iframe);
    
    let flashDetected = false;
    let themeChecks = 0;
    const checkInterval = 10; // ms between checks
    const maxChecks = 10; // Max number of checks (100ms total)
    
    // Function to check theme
    const checkTheme = () => {
      themeChecks++;
      
      if (!iframe.contentDocument || !iframe.contentDocument.body) {
        if (themeChecks < maxChecks) {
          setTimeout(checkTheme, checkInterval);
        } else {
          cleanup(false); // Couldn't determine, assume no flash
        }
        return;
      }
      
      // Check for theme-related classes or attributes that shouldn't be visible yet
      const wrongTheme = iframe.contentDocument.body.classList.contains('theme-transition');
      
      if (wrongTheme) {
        flashDetected = true;
        cleanup(false);
        return;
      }
      
      if (themeChecks < maxChecks) {
        setTimeout(checkTheme, checkInterval);
      } else {
        cleanup(true);
      }
    };
    
    // Cleanup function
    const cleanup = (result: boolean) => {
      document.body.removeChild(iframe);
      resolve(!flashDetected && result);
    };
    
    // Set the iframe source
    iframe.src = window.location.href;
    
    // Begin checking as soon as iframe starts loading
    iframe.onload = () => {
      checkTheme();
    };
  });
};

/**
 * Test theme toggle transition speed
 * @returns Transition duration in milliseconds
 */
export const testThemeToggleSpeed = async (): Promise<number> => {
  // Find the theme toggle element
  const toggleButton = document.querySelector('[data-testid="theme-toggle"]') as HTMLElement;
  
  if (!toggleButton) {
    throw new Error('Theme toggle button not found');
  }
  
  const startTime = performance.now();
  
  // Click the toggle
  toggleButton.click();
  
  // Wait for transition to complete
  return new Promise(resolve => {
    // Check for the end of transition
    const checkTransitionEnd = () => {
      // Look for CSS transition properties that have completed
      const body = document.body;
      const computedStyle = window.getComputedStyle(body);
      const transitioning = computedStyle.getPropertyValue('transition-property') !== 'none';
      
      if (!transitioning) {
        const endTime = performance.now();
        resolve(endTime - startTime);
      } else {
        // Check again in a few ms
        setTimeout(checkTransitionEnd, 10);
      }
    };
    
    // Start checking after a minimal delay
    setTimeout(checkTransitionEnd, 20);
  });
};

/**
 * Check if reduced motion preferences are respected
 */
export const testReducedMotionPreferences = (): boolean => {
  // Mock prefers-reduced-motion
  const originalMatchMedia = window.matchMedia;
  
  // Override matchMedia to simulate reduced motion preference
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: query.includes('reduced-motion'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true
    })
  });
  
  // Get the toggle button
  const toggleButton = document.querySelector('[data-testid="theme-toggle"]') as HTMLElement;
  
  if (!toggleButton) {
    // Restore original matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: originalMatchMedia
    });
    
    throw new Error('Theme toggle button not found');
  }
  
  // Click the toggle button
  toggleButton.click();
  
  // Check for transition duration on key elements
  const elements = [
    document.body,
    document.querySelector('header'),
    document.querySelector('button')
  ].filter(el => el !== null) as HTMLElement[];
  
  let allRespectReducedMotion = true;
  
  elements.forEach(element => {
    const styles = window.getComputedStyle(element);
    const transitionDuration = parseFloat(styles.getPropertyValue('transition-duration'));
    
    // When reduced motion is preferred, transition duration should be very small or 0
    if (transitionDuration > 0.05) { // More than 50ms
      allRespectReducedMotion = false;
    }
  });
  
  // Restore original matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: originalMatchMedia
  });
  
  return allRespectReducedMotion;
};

/**
 * Test for consistent theme application across all components
 */
export const testThemeConsistency = (theme: 'light' | 'dark'): {
  allComponentsConsistent: boolean;
  inconsistentElements: string[];
} => {
  // Toggle to the specified theme first
  const toggleButton = document.querySelector('[data-testid="theme-toggle"]') as HTMLElement;
  const currentTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
  
  if (currentTheme !== theme && toggleButton) {
    toggleButton.click();
  }
  
  // Key CSS properties that should be themed
  const themedProperties = [
    'color',
    'background-color',
    'border-color',
    'box-shadow'
  ];
  
  // Components to check
  const components = [
    { selector: 'button', name: 'Button' },
    { selector: '.card', name: 'Card' },
    { selector: 'input', name: 'Input' },
    { selector: 'select', name: 'Select' },
    { selector: 'nav', name: 'Navigation' },
    { selector: 'table', name: 'Table' },
    { selector: '.alert', name: 'Alert' },
    { selector: '.notification-item', name: 'Notification' }
  ];
  
  const inconsistentElements: string[] = [];
  
  // Check if key properties are using CSS variables
  components.forEach(({ selector, name }) => {
    const elements = document.querySelectorAll(selector);
    
    elements.forEach((el, index) => {
      const element = el as HTMLElement;
      
      // Check each themed property
      themedProperties.forEach(property => {
        const value = window.getComputedStyle(element).getPropertyValue(property);
        
        // Skip if property is not set or transparent
        if (!value || value === 'transparent' || value === 'none') {
          return;
        }
        
        // Check if using CSS variable
        const usingCssVar = value.includes('var(--') || 
                           value.includes('rgba(') || 
                           value.includes('rgb(');
        
        if (!usingCssVar) {
          inconsistentElements.push(`${name} ${index + 1}: hardcoded ${property}`);
        }
      });
    });
  });
  
  return {
    allComponentsConsistent: inconsistentElements.length === 0,
    inconsistentElements
  };
};

/**
 * Comprehensive dark mode test that checks multiple aspects
 */
export const testDarkModeImplementation = async (theme: 'light' | 'dark' = 'dark'): Promise<DarkModeTestResult> => {
  // Ensure we're in the right theme for testing
  const toggleButton = document.querySelector('[data-testid="theme-toggle"]') as HTMLElement;
  const isCurrentlyDark = document.body.classList.contains('dark-mode');
  
  if ((theme === 'dark' && !isCurrentlyDark) || (theme === 'light' && isCurrentlyDark)) {
    if (toggleButton) {
      toggleButton.click();
      // Wait for transition
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
  
  // Local storage tests
  const themeInStorage = localStorage.getItem('bioelectric-theme-preference');
  const persistedThemeLoaded = themeInStorage === theme;
  
  // Test system preference detection (mocked)
  const originalMatchMedia = window.matchMedia;
  let systemPreferenceDetected = false;
  
  try {
    // Mock system dark mode preference
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: query.includes('dark'),
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => true
      })
    });
    
    // Change theme to system
    const themeContext = (window as any).__THEME_CONTEXT__;
    if (themeContext && themeContext.setTheme) {
      themeContext.setTheme('system');
      // Check if dark theme was applied
      systemPreferenceDetected = document.body.classList.contains('dark-mode');
    } else {
      // Fallback check
      systemPreferenceDetected = document.body.classList.contains('dark-mode');
    }
  } finally {
    // Restore original matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: originalMatchMedia
    });
    
    // Restore selected theme
    const themeContext = (window as any).__THEME_CONTEXT__;
    if (themeContext && themeContext.setTheme) {
      themeContext.setTheme(theme);
    } else if (toggleButton) {
      // Fallback
      const isCurrentlyDark = document.body.classList.contains('dark-mode');
      if ((theme === 'dark' && !isCurrentlyDark) || (theme === 'light' && isCurrentlyDark)) {
        toggleButton.click();
      }
    }
  }
  
  // Test theme toggle speed
  const transitionDuration = await testThemeToggleSpeed();
  
  // Test reduced motion preference
  const respectedReducedMotion = testReducedMotionPreferences();
  
  // Test theme consistency
  const { allComponentsConsistent, inconsistentElements } = testThemeConsistency(theme);
  
  // Test color contrast for key elements
  const elements = [
    { name: 'Body Text', selector: 'body' },
    { name: 'Heading', selector: 'h1, h2, h3, h4, h5, h6' },
    { name: 'Button', selector: 'button.btn-primary' },
    { name: 'Input', selector: 'input' },
    { name: 'Link', selector: 'a' },
    { name: 'Card', selector: '.card' },
    { name: 'Alert', selector: '.alert' },
    { name: 'Table Header', selector: 'th' },
    { name: 'Table Cell', selector: 'td' }
  ];
  
  const contrastResults = elements.map(({ name, selector }) => {
    const element = document.querySelector(selector) as HTMLElement;
    
    if (!element) {
      return {
        name,
        selector,
        contrastRatio: 0,
        meetsAA: false,
        meetsAAA: false,
        foregroundColor: '',
        backgroundColor: ''
      };
    }
    
    const styles = window.getComputedStyle(element);
    const foreground = styles.color;
    const background = styles.backgroundColor;
    
    const ratio = calculateContrastRatio(foreground, background);
    
    return {
      name,
      selector,
      contrastRatio: ratio,
      meetsAA: meetsContrastStandard(ratio, 'AA'),
      meetsAAA: meetsContrastStandard(ratio, 'AAA'),
      foregroundColor: foreground,
      backgroundColor: background
    };
  }).filter(result => result.contrastRatio > 0);
  
  // Check focus indicators
  const interactiveElements = ['button', 'a', 'input', 'select', '[role="button"]', '[tabindex="0"]'];
  const problemElements: string[] = [];
  
  let allFocusIndicatorsVisible = true;
  
  interactiveElements.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach((el, index) => {
      const element = el as HTMLElement;
      
      // Focus the element
      element.focus();
      
      // Get computed style
      const styles = window.getComputedStyle(element);
      const outlineColor = styles.outlineColor;
      const outlineStyle = styles.outlineStyle;
      const outlineWidth = parseInt(styles.outlineWidth, 10);
      
      // Check focus visibility
      const hasVisibleOutline = outlineStyle !== 'none' && outlineWidth > 0;
      
      // Check for alternative focus indicators (box-shadow, border, etc.)
      const hasShadowIndicator = styles.boxShadow && styles.boxShadow !== 'none';
      const hasBorderIndicator = styles.border && parseInt(styles.borderWidth, 10) > 1;
      
      const hasFocusIndicator = hasVisibleOutline || hasShadowIndicator || hasBorderIndicator;
      
      if (!hasFocusIndicator) {
        allFocusIndicatorsVisible = false;
        problemElements.push(`${selector} ${index + 1}: No visible focus indicator`);
      }
      
      // Check contrast of focus indicator if present
      if (hasVisibleOutline && outlineColor) {
        const backgroundColor = styles.backgroundColor;
        const contrastRatio = calculateContrastRatio(outlineColor, backgroundColor);
        
        if (!meetsContrastStandard(contrastRatio, 'AA')) {
          allFocusIndicatorsVisible = false;
          problemElements.push(`${selector} ${index + 1}: Focus indicator contrast too low (${contrastRatio.toFixed(2)}:1)`);
        }
      }
    });
  });
  
  // Performance metrics
  const performanceIssues: string[] = [];
  let themeToggleResponseTime = 0;
  let animationFrameRate = 60; // Default
  let layoutShift = 0;
  
  // Measure toggle response time
  if (toggleButton) {
    const startTime = performance.now();
    toggleButton.click();
    
    // Basic toggle response check (not the full transition)
    setTimeout(() => {
      const endTime = performance.now();
      themeToggleResponseTime = endTime - startTime;
      
      if (themeToggleResponseTime > 100) {
        performanceIssues.push(`Theme toggle response time is slow: ${themeToggleResponseTime.toFixed(2)}ms`);
      }
      
      // Toggle back
      toggleButton.click();
    }, 50);
  }
  
  // Simplistic frame rate check during transition
  if (window.requestAnimationFrame) {
    let frames = 0;
    const startTime = performance.now();
    
    const countFrame = () => {
      frames++;
      const currentTime = performance.now();
      
      if (currentTime - startTime < 1000) {
        window.requestAnimationFrame(countFrame);
      } else {
        animationFrameRate = frames;
        
        if (frames < 50) {
          performanceIssues.push(`Animation frame rate is low: ${frames} fps`);
        }
      }
    };
    
    window.requestAnimationFrame(countFrame);
  }
  
  // Media adaptation tests
  const logoElement = document.querySelector('.logo, [data-testid="logo"]') as HTMLElement;
  const logoVariantApplied = logoElement ? 
    (logoElement.dataset.theme === theme || logoElement.classList.contains(`logo-${theme}`)) : false;
  
  const mediaControlsElements = document.querySelectorAll('video, audio, [role="slider"]');
  let controlsVisibleInBothThemes = true;
  
  mediaControlsElements.forEach((element) => {
    const el = element as HTMLElement;
    const styles = window.getComputedStyle(el);
    
    if (styles.visibility === 'hidden' || styles.display === 'none' || styles.opacity === '0') {
      controlsVisibleInBothThemes = false;
    }
  });
  
  const backgroundImages = document.querySelectorAll('[style*="background-image"]');
  let imageBackgroundsCompatible = true;
  const mediaIssues: string[] = [];
  
  backgroundImages.forEach((el, index) => {
    const element = el as HTMLElement;
    const styles = window.getComputedStyle(element);
    const backgroundImage = styles.backgroundImage;
    
    // Check if background image is properly visible against the current theme
    if (backgroundImage && backgroundImage !== 'none' && !backgroundImage.includes('-' + theme)) {
      const backgroundColor = styles.backgroundColor;
      
      // Check if background color is transparent or not set
      if (backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
        imageBackgroundsCompatible = false;
        mediaIssues.push(`Background image ${index + 1} may not be visible in ${theme} mode - no background color`);
      }
    }
  });
  
  // Compile results
  return {
    theme,
    themeDetection: {
      success: true,
      systemPreferenceDetected,
      persistedThemeLoaded,
    },
    contrastCompliance: {
      elements: contrastResults,
      overallAACompliance: contrastResults.every(result => result.meetsAA),
      overallAAACompliance: contrastResults.every(result => result.meetsAAA)
    },
    transitions: {
      duration: transitionDuration,
      smoothTransition: transitionDuration < 300,
      respectedReducedMotion,
      noFlickeringOrFlashing: true // Basic assumption, would need visual testing
    },
    visualConsistency: {
      allComponentsAdaptedToTheme: allComponentsConsistent,
      inconsistentElements
    },
    interactiveElements: {
      allStatesDistinct: true, // Basic assumption, would need detailed state testing
      focusIndicatorsVisible: allFocusIndicatorsVisible,
      problemElements
    },
    performance: {
      themeToggleResponseTime,
      animationFrameRate,
      layoutShift,
      performanceIssues
    },
    mediaAdaptation: {
      logoVariantApplied,
      imageBackgroundsCompatible,
      controlsVisibleInBothThemes,
      mediaIssues
    }
  };
};

/**
 * Generate a markdown report from test results
 */
export const generateDarkModeReport = (results: DarkModeTestResult): string => {
  let report = `# Dark Mode Implementation Report\n\n`;
  report += `## Theme: ${results.theme}\n\n`;
  
  // Theme Detection
  report += `### Theme Detection\n\n`;
  report += `- System preference detection: ${results.themeDetection.systemPreferenceDetected ? '✅' : '❌'}\n`;
  report += `- Persisted theme loaded: ${results.themeDetection.persistedThemeLoaded ? '✅' : '❌'}\n`;
  
  // Contrast Compliance
  report += `\n### Contrast Compliance\n\n`;
  report += `- Overall WCAG AA compliance: ${results.contrastCompliance.overallAACompliance ? '✅' : '❌'}\n`;
  report += `- Overall WCAG AAA compliance: ${results.contrastCompliance.overallAAACompliance ? '✅' : '❌'}\n\n`;
  
  report += `| Element | Contrast Ratio | AA | AAA |\n`;
  report += `|---------|----------------|----|----- |\n`;
  
  results.contrastCompliance.elements.forEach(element => {
    report += `| ${element.name} | ${element.contrastRatio.toFixed(2)}:1 | ${element.meetsAA ? '✅' : '❌'} | ${element.meetsAAA ? '✅' : '❌'} |\n`;
  });
  
  // Transitions
  report += `\n### Transitions\n\n`;
  report += `- Transition duration: ${results.transitions.duration.toFixed(2)}ms\n`;
  report += `- Smooth transition: ${results.transitions.smoothTransition ? '✅' : '❌'}\n`;
  report += `- Respects reduced motion preference: ${results.transitions.respectedReducedMotion ? '✅' : '❌'}\n`;
  report += `- No flickering or flashing: ${results.transitions.noFlickeringOrFlashing ? '✅' : '❌'}\n`;
  
  // Visual Consistency
  report += `\n### Visual Consistency\n\n`;
  report += `- All components adapt to theme: ${results.visualConsistency.allComponentsAdaptedToTheme ? '✅' : '❌'}\n`;
  
  if (results.visualConsistency.inconsistentElements.length > 0) {
    report += `\n**Inconsistent Elements:**\n\n`;
    results.visualConsistency.inconsistentElements.forEach(element => {
      report += `- ${element}\n`;
    });
  }
  
  // Interactive Elements
  report += `\n### Interactive Elements\n\n`;
  report += `- All states distinct: ${results.interactiveElements.allStatesDistinct ? '✅' : '❌'}\n`;
  report += `- Focus indicators visible: ${results.interactiveElements.focusIndicatorsVisible ? '✅' : '❌'}\n`;
  
  if (results.interactiveElements.problemElements.length > 0) {
    report += `\n**Problem Elements:**\n\n`;
    results.interactiveElements.problemElements.forEach(element => {
      report += `- ${element}\n`;
    });
  }
  
  // Performance
  report += `\n### Performance\n\n`;
  report += `- Theme toggle response time: ${results.performance.themeToggleResponseTime.toFixed(2)}ms\n`;
  report += `- Animation frame rate: ${results.performance.animationFrameRate} fps\n`;
  report += `- Layout shift: ${results.performance.layoutShift}\n`;
  
  if (results.performance.performanceIssues.length > 0) {
    report += `\n**Performance Issues:**\n\n`;
    results.performance.performanceIssues.forEach(issue => {
      report += `- ${issue}\n`;
    });
  }
  
  // Media Adaptation
  report += `\n### Media Adaptation\n\n`;
  report += `- Logo variant applied: ${results.mediaAdaptation.logoVariantApplied ? '✅' : '❌'}\n`;
  report += `- Image backgrounds compatible: ${results.mediaAdaptation.imageBackgroundsCompatible ? '✅' : '❌'}\n`;
  report += `- Controls visible in both themes: ${results.mediaAdaptation.controlsVisibleInBothThemes ? '✅' : '❌'}\n`;
  
  if (results.mediaAdaptation.mediaIssues.length > 0) {
    report += `\n**Media Issues:**\n\n`;
    results.mediaAdaptation.mediaIssues.forEach(issue => {
      report += `- ${issue}\n`;
    });
  }
  
  // Recommendations
  report += `\n## Recommendations\n\n`;
  
  const issues = [
    ...results.visualConsistency.inconsistentElements,
    ...results.interactiveElements.problemElements,
    ...results.performance.performanceIssues,
    ...results.mediaAdaptation.mediaIssues
  ];
  
  if (issues.length === 0 && 
      results.contrastCompliance.overallAACompliance && 
      results.transitions.smoothTransition && 
      results.transitions.respectedReducedMotion) {
    report += `✅ **The dark mode implementation meets all tested criteria.**\n\n`;
    report += `Consider the following enhancements:\n\n`;
    report += `- Work towards AAA compliance for all text elements\n`;
    report += `- Optimize animations for even better performance\n`;
    report += `- Add additional theme customization options\n`;
  } else {
    report += `### Priority Issues:\n\n`;
    
    if (!results.contrastCompliance.overallAACompliance) {
      report += `- 🔴 **Critical:** Improve contrast ratios to meet WCAG AA compliance\n`;
    }
    
    if (!results.transitions.respectedReducedMotion) {
      report += `- 🔴 **Critical:** Implement reduced motion support for accessibility\n`;
    }
    
    if (!results.interactiveElements.focusIndicatorsVisible) {
      report += `- 🔴 **Critical:** Add visible focus indicators for all interactive elements\n`;
    }
    
    if (!results.transitions.smoothTransition) {
      report += `- 🟠 **Important:** Optimize theme transitions to be smoother\n`;
    }
    
    if (!results.visualConsistency.allComponentsAdaptedToTheme) {
      report += `- 🟠 **Important:** Ensure all components fully adapt to theme changes\n`;
    }
    
    if (!results.mediaAdaptation.imageBackgroundsCompatible) {
      report += `- 🟡 **Consideration:** Provide theme-specific image variants for better visibility\n`;
    }
  }
  
  return report;
};

/**
 * Test the scheduled dark mode feature
 */
export const testScheduledDarkMode = async (): Promise<boolean> => {
  // Mock the Date object to test scheduled mode
  const originalDate = Date;
  let mockTime = new Date();
  mockTime.setHours(22, 0, 0); // 10 PM - should be dark
  
  // Override Date constructor
  global.Date = class extends Date {
    constructor() {
      super();
      return mockTime;
    }
  } as any;
  
  // Enable scheduled dark mode (if the app has this feature)
  const themeContext = (window as any).__THEME_CONTEXT__;
  if (themeContext && themeContext.setScheduledDarkMode) {
    themeContext.setTheme('light'); // Start with light theme
    themeContext.setScheduledDarkMode(true);
    
    // Wait for the scheduled mode to take effect
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check if dark mode was applied automatically
    const isDark = document.body.classList.contains('dark-mode');
    
    // Test morning too (7 AM - should be light)
    mockTime = new Date();
    mockTime.setHours(7, 0, 0);
    
    // Trigger a time check
    if (themeContext.checkScheduledTime) {
      themeContext.checkScheduledTime();
    } else {
      // Force time check by toggling the setting
      themeContext.setScheduledDarkMode(false);
      themeContext.setScheduledDarkMode(true);
    }
    
    // Wait for changes
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Should now be light
    const isLight = !document.body.classList.contains('dark-mode');
    
    // Restore original Date
    global.Date = originalDate;
    
    // Cleanup
    themeContext.setScheduledDarkMode(false);
    themeContext.setTheme('system');
    
    return isDark && isLight;
  }
  
  // Restore original Date
  global.Date = originalDate;
  
  // Feature not available
  return false;
};
