# Copilot Instructions - JTF Translation Festival 2026 Teaser Site

## Project Overview

**JTF翻訳祭2026** (35th Japan Translation Federation Festival) teaser website. A lightweight, single-page / multi-page static site using vanilla HTML + CSS + JavaScript.

- **Architecture**: No build tools. Vanilla HTML/CSS/JS with CDN dependencies
- **CSS Framework**: Tailwind CSS (CDN)
- **Content Management**: MicroCMS (optional via Fetch API)
- **Design System**: Apple-inspired minimalist aesthetic with smooth animations

## File Structure

```
.
├── index.html           # Main landing page (hero, concept, features, news, footer)
├── sessions.html        # Speaker/session listings (Bento grid layout)
├── mypage.html          # User profile/registration page
├── ticket.html          # Ticket display/generation
├── ticket-pdf.html      # PDF-friendly ticket template
└── CLAUDE.md            # Existing AI instructions (reference)
```

## Core Patterns & Architecture

### 1. **Scroll Animation Pattern** (Intersection Observer)
All `.reveal` elements fade in with a 30px upward translateY on scroll:
- Defined in `<style>`: `.reveal { opacity: 0; transform: translateY(30px); }`
- Activated by `observer.unobserve()` when `.isIntersecting`
- **Stagger delays**: `.delay-100/.delay-200/.delay-300` for sequential animations
- **Example**: `<div class="reveal delay-100">...</div>`
- **Why this pattern?**: Smooth, performant entrance animations without heavy libraries

### 2. **CSS Architecture** (Embedded `<style>` Tag)
- No external CSS file; everything in `<style>` tag within each HTML
- Custom utilities for animations, gradients, and effects
- Tailwind CSS handles layout/spacing/colors
- **Pattern example**:
  ```css
  .bento-card {
      transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease;
  }
  .bento-card:hover {
      transform: scale(1.02);
      box-shadow: 0 20px 40px rgba(0,0,0,0.08);
  }
  ```

### 3. **Parallax Orb Background**
- Positioned `.orb` elements animate on `mousemove`
- Moves based on cursor position with multiplied speed offsets per orb
- Creates depth illusion without expensive rendering
- **Code**: `document.addEventListener('mousemove', ...)` multiplies `e.clientX/Y` by speed indices

### 4. **MicroCMS Integration** (Fetch API)
- No SDK; uses native Fetch API for better reliability
- Config object at top of script: `CMS_CONFIG = { serviceDomain, apiKey }`
- **Fallback behavior**: If API keys are defaults ("YOUR_DOMAIN"/"YOUR_API_KEY"), renders dummy data
- Endpoint: `https://${serviceDomain}.microcms.io/api/v1/news?limit=3`
- **Error handling**: Gracefully falls back to dummy news on fetch failure
- **Why Fetch?**: Simpler, smaller footprint than SDK; easier to debug

### 5. **Navbar Blur Effect**
- Navbar gets `.shadow-sm` class when `scrollY > 50`
- Uses `backdrop-filter: blur(20px)` for glass effect
- Smooth transition for visual polish

### 6. **Bento Grid Layout** (`sessions.html`)
- `grid grid-cols-1 md:grid-cols-3 md:grid-rows-2` with custom height constraints
- Large featured card spans 2 columns/rows on desktop
- Cards use `.speaker-card` with hover scale + shadow effects
- **Speaker overlay**: Hidden by default, revealed on hover with opacity transition

## Development Workflow

### No Build Step Required
Open any `.html` file in a browser directly, or serve via:
```bash
python -m http.server 8000
```

### Testing CDN Resources
- **Fonts** (Google Fonts): Preconnect + crossorigin
- **Tailwind**: Script tag from CDN
- **FontAwesome**: CDN link for icons
- Ensure internet connectivity; CDN resources won't cache locally

### Making Content Changes
1. Edit text/structure in `.html` directly
2. Keep animation classes (`.reveal`, `.delay-*`) intact
3. Use Tailwind utility classes for responsive breakpoints
4. Test responsiveness: mobile first, then tablet (`md:`), then desktop

### CMS Content Updates
- Modify `CMS_CONFIG` credentials to point to live MicroCMS instance
- API responses must contain `contents` array with `{ title, description, publishedAt, url? }`
- Dummy data defined in `dummyNews` variable serves as fallback/reference

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| No build tools | Simplicity, fast iteration, immediate browser preview |
| Embedded CSS | Single-file dependency per page; no external stylesheet management |
| Fetch API over SDK | Lower bundle footprint; native browser API; easier debugging |
| Bento grid + cards | Modern, scannable layout; aligns with Apple/modern design trends |
| IntersectionObserver | Performant scroll animations; doesn't block main thread |
| Parallax orbs | Subtle depth; mouse-driven interactivity; lightweight CPU usage |

## Common Tasks

### Adding a New Section
1. Create semantic HTML (`<section id="name">`)
2. Wrap content in `.max-w-7xl mx-auto` for layout consistency
3. Add `.reveal` classes to elements for entrance animation
4. Use Tailwind for spacing: `py-20 px-6` (padding), `mb-16` (margins)
5. Apply custom animations in `<style>` if needed

### Updating News/Content
- Edit `dummyNews` array structure in JavaScript
- Ensure shape matches MicroCMS API response (`title`, `description`, `publishedAt`, `url`)
- Test with DevTools Network tab to verify API calls

### Responsive Design
- **Mobile-first approach**: Default styles apply to mobile
- **Breakpoints**: `md:` for tablet/desktop
- **Example**: `grid grid-cols-1 md:grid-cols-3` (1 column mobile, 3 columns medium+)
- Always test at 375px (mobile), 768px (tablet), 1200px+ (desktop)

### Styling Hierarchy
1. Tailwind utility classes (layout, spacing, basic colors)
2. Custom `.reveal` / animation classes (in `<style>`)
3. Hover/interactive states (component-specific in `<style>`)

## Debugging Tips

- **Animation lag?** Check `.reveal` transition timing; adjust `rootMargin` in IntersectionObserver
- **Parallax not moving?** Verify `.orb` elements exist in DOM and have absolute positioning
- **CMS fetch failing?** Check console for API key errors; verify `Access-Control-Allow-Origin` headers
- **Responsive issues?** Inspect in DevTools device emulation; check Tailwind breakpoint prefixes
- **Performance?** Use DevTools Performance tab; watch for repaints during scroll/mouse movement

## External Dependencies

| Resource | Purpose | Fallback |
|----------|---------|----------|
| Google Fonts (Inter, Noto Sans JP) | Typography | System fonts if CDN unavailable |
| Tailwind CSS CDN | Layout/spacing/utilities | Manual CSS if needed |
| FontAwesome 6.4.0 | Icons | Text labels if icons fail |
| MicroCMS API | News content | Dummy data baked into JS |

## Notes for AI Agents

- **Don't** add build tools or preprocessors without explicit request
- **Do** preserve `.reveal` animation class patterns when refactoring
- **Do** test responsive breakpoints (`md:`) after layout changes
- **Do** maintain fallback logic (dummy data) in MicroCMS integration
- **Don't** move CSS out of `<style>` tags without architectural discussion
- **Prefer** native APIs (Fetch, IntersectionObserver) over polyfills/libraries

