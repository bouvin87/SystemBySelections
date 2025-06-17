/**
 * Theme Manager - Dynamic CSS Variable Management
 * Handles tenant-specific color themes by setting CSS variables
 */

export interface TenantTheme {
  colorPrimary: string;
  colorSecondary: string;
  colorAccent: string;
  colorWarning: string;
  colorBackground: string;
  colorText: string;
  colorLink: string;
  colorLinkHover: string;
}

export const defaultTheme: TenantTheme = {
  colorPrimary: '#3b82f6',
  colorSecondary: '#6b7280',
  colorAccent: '#10b981',
  colorWarning: '#f59e0b',
  colorBackground: '#ffffff',
  colorText: '#111827',
  colorLink: '#3b82f6',
  colorLinkHover: '#2563eb',
};

/**
 * Apply theme colors by setting CSS variables on document root
 */
export function applyTheme(theme: Partial<TenantTheme>) {
  const root = document.documentElement;
  const finalTheme = { ...defaultTheme, ...theme };

  // Set CSS variables for tenant colors
  root.style.setProperty('--color-primary', finalTheme.colorPrimary);
  root.style.setProperty('--color-secondary', finalTheme.colorSecondary);
  root.style.setProperty('--color-accent', finalTheme.colorAccent);
  root.style.setProperty('--color-warning', finalTheme.colorWarning);
  root.style.setProperty('--color-background', finalTheme.colorBackground);
  root.style.setProperty('--color-text', finalTheme.colorText);

  // Also update primary color for shadcn components to match tenant theme
  root.style.setProperty('--primary', finalTheme.colorPrimary);
}

/**
 * Reset theme to default values
 */
export function resetTheme() {
  applyTheme(defaultTheme);
}

/**
 * Get current theme values from CSS variables
 */
export function getCurrentTheme(): TenantTheme {
  const root = document.documentElement;
  const computedStyle = getComputedStyle(root);

  return {
    colorPrimary: computedStyle.getPropertyValue('--color-primary').trim() || defaultTheme.colorPrimary,
    colorSecondary: computedStyle.getPropertyValue('--color-secondary').trim() || defaultTheme.colorSecondary,
    colorAccent: computedStyle.getPropertyValue('--color-accent').trim() || defaultTheme.colorAccent,
    colorWarning: computedStyle.getPropertyValue('--color-warning').trim() || defaultTheme.colorWarning,
    colorBackground: computedStyle.getPropertyValue('--color-background').trim() || defaultTheme.colorBackground,
    colorText: computedStyle.getPropertyValue('--color-text').trim() || defaultTheme.colorText,
  };
}

/**
 * Validate hex color format
 */
export function isValidHexColor(color: string): boolean {
  return /^#[0-9A-F]{6}$/i.test(color);
}

/**
 * Convert RGB to Hex
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * Generate accessible color variants
 */
export function generateColorVariants(baseColor: string) {
  // Simple color manipulation for hover states, etc.
  const color = baseColor.replace('#', '');
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);

  // Generate darker variant for hover
  const darker = {
    r: Math.max(0, r - 20),
    g: Math.max(0, g - 20),
    b: Math.max(0, b - 20),
  };

  // Generate lighter variant for background
  const lighter = {
    r: Math.min(255, r + 40),
    g: Math.min(255, g + 40),
    b: Math.min(255, b + 40),
  };

  return {
    base: baseColor,
    darker: rgbToHex(darker.r, darker.g, darker.b),
    lighter: rgbToHex(lighter.r, lighter.g, lighter.b),
  };
}