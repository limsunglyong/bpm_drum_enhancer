---
name: Sonic Precision
colors:
  surface: '#131315'
  surface-dim: '#131315'
  surface-bright: '#39393b'
  surface-container-lowest: '#0e0e10'
  surface-container-low: '#1b1b1d'
  surface-container: '#201f21'
  surface-container-high: '#2a2a2c'
  surface-container-highest: '#353437'
  on-surface: '#e5e1e4'
  on-surface-variant: '#b9cacb'
  inverse-surface: '#e5e1e4'
  inverse-on-surface: '#303032'
  outline: '#849495'
  outline-variant: '#3b494b'
  surface-tint: '#00dbe9'
  primary: '#dbfcff'
  on-primary: '#00363a'
  primary-container: '#00f0ff'
  on-primary-container: '#006970'
  inverse-primary: '#006970'
  secondary: '#a7ffb3'
  on-secondary: '#003915'
  secondary-container: '#00ee70'
  on-secondary-container: '#00662c'
  tertiary: '#faf3ff'
  on-tertiary: '#3c0090'
  tertiary-container: '#e1d2ff'
  on-tertiary-container: '#7213ff'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#7df4ff'
  primary-fixed-dim: '#00dbe9'
  on-primary-fixed: '#002022'
  on-primary-fixed-variant: '#004f54'
  secondary-fixed: '#66ff8f'
  secondary-fixed-dim: '#00e46b'
  on-secondary-fixed: '#00210a'
  on-secondary-fixed-variant: '#005322'
  tertiary-fixed: '#e9ddff'
  tertiary-fixed-dim: '#d1bcff'
  on-tertiary-fixed: '#23005b'
  on-tertiary-fixed-variant: '#5700c9'
  background: '#131315'
  on-background: '#e5e1e4'
  surface-variant: '#353437'
typography:
  display:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  h1:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  h2:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.4'
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.08em
  mono-data:
    fontFamily: Space Grotesk
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1'
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin: 24px
  track-height: 64px
  sidebar-width: 280px
---

## Brand & Style

This design system is engineered for the high-performance environment of modern music production. The brand personality is technical, focused, and immersive, prioritizing clarity in low-light studio environments. 

The aesthetic blends **Minimalism** with subtle **Glassmorphism** to create a sense of depth without clutter. By utilizing a dark, "lights-out" interface, we minimize visual fatigue during long mixing sessions. High-tech precision is communicated through razor-thin lines, rhythmic spacing, and vibrant neon feedback loops that mimic hardware LED indicators. The emotional response is one of absolute control and creative flow.

## Colors

The palette is anchored by "Deep Charcoal" (#121214), providing a non-distracting canvas that absorbs light. 

- **Primary (Electric Blue):** Used for primary action states, active transport controls, and selected waveform highlights.
- **Secondary (Neon Lime):** Reserved for "active" indicators, level meters (safe zones), and secondary toggles.
- **Surface Tiers:** We use a series of charcoal shades (Base: #121214, Surface: #1C1C1E, Overlay: #2C2C2E) to define hierarchy.
- **Functional Colors:** Signal peaks use a hot pink/red (#FF4B5C), while background grids use a low-contrast grey (#3A3A3C).

## Typography

The typographic system utilizes **Space Grotesk** for headings and technical data to reinforce the futuristic, high-tech aesthetic. Its geometric terminals mirror the precision of digital audio. 

**Inter** is the workhorse for all functional UI elements and body text, chosen for its exceptional legibility at small sizes—critical for complex plugin panels and track labels. We employ a strict "Label-Caps" style for section headers and "Mono-Data" for timecodes and frequency values to ensure numeric alignment in changing states.

## Layout & Spacing

The layout utilizes a **fluid-grid** model within a fixed-height viewport, characteristic of Digital Audio Workstations (DAWs). A 4px base unit governs all dimensions, ensuring mathematical consistency across the UI.

- **Main Workspace:** A flexible center pane for the timeline and arrangement view.
- **Inspectors:** Fixed-width sidebars (280px) for channel strips and plugin parameters.
- **Rhythm:** Spacing between modules is tight (8px or 12px) to maximize screen real estate, while internal padding within cards is more generous (16px) to maintain clarity.

## Elevation & Depth

This design system rejects traditional drop shadows in favor of **Tonal Layering** and **Inner Glows**. 

Depth is achieved by making elevated elements lighter in color. The base "Floor" is the darkest (#121214), while "Floating" panels (like VST windows) use #2C2C2E with a 1px border of #3A3A3C. 

To simulate a high-tech glow, active elements (like a triggered pad or an "On" button) feature a subtle outer bloom of their accent color (Primary or Secondary) with a 10px blur and 20% opacity. Backdrop blurs (20px) are used behind modal overlays to maintain context of the underlying waveform without visual noise.

## Shapes

The shape language is "Sleek Geometry." We use a **Rounded** (0.5rem) base for standard components like buttons and input fields to soften the technical edge. 

- **Track Containers:** Use a slightly tighter 4px radius for internal grouping.
- **Interactive Knobs:** Perfect circles with a 2px inner stroke.
- **Waveform Containers:** Sharp or 2px radius to maximize the visibility of the audio data.
- **Visual Distinction:** Active states may transition from a 1px stroke to a solid fill, maintaining the same corner radius.

## Components

- **Buttons:** Primary buttons are ghost-style with a 1px Electric Blue border and text, filling with solid color only on hover or active state.
- **Knobs & Sliders:** The "track" of the slider is a dark recessed groove (#1C1C1E). The "handle" is a high-contrast neutral or neon accent. 
- **Waveforms:** Rendered as vector paths with a gradient fill (Electric Blue to Transparent). The background grid is a subtle dotted pattern.
- **Chips/Tags:** Used for FX chains; small, low-profile, with 4px rounding and monospaced text.
- **Meters:** Vertical stacks of 2px high segments. Neon Green for -inf to -6dB, Yellow for -6dB to -2dB, and Neon Red for clipping.
- **Input Fields:** Recessed appearance using a subtle inner shadow and a high-contrast focus ring in Electric Blue.