# JTF Translation Festival 2026 - AI Coding Agent Instructions

## Project Overview

**JTF翻訳祭2026（第35回JTF Translation Festival）** - A teaser/promotional website for Japan's largest translation conference. Multi-page static HTML site with Apple-inspired modern design, built with **zero build tools** (pure HTML, CSS, and vanilla JavaScript).

**Key trait**: Single-page `index.html` plus dedicated pages (`sessions.html`, `ticket.html`, `mypage.html`, `ticket-pdf.html`) all self-contained with embedded CSS/JS. No frameworks, no bundlers.

## Architecture Patterns

### Page Structure
- **index.html**: Landing page with hero, concept, features (Bento Grid), news section, footer with newsletter signup
- **sessions.html**: Sessions & speakers directory with category filtering (keynote, panel, workshop, AI)
- **ticket.html**: Ticket purchase interface with pricing tiers and PDFs
- **mypage.html**: User dashboard (placeholder for future auth/ticket management)
- All pages share: Tailwind CSS, Google Fonts (Inter + Noto Sans JP), FontAwesome icons, custom `.reveal` animations

### Styling Architecture
- **Tailwind CDN**: `<script src="https://cdn.tailwindcss.com"></script>` - no build config
- **Custom CSS** in `<style>` block includes:
  - `.reveal`: Intersection Observer scroll animations (opacity + translateY, cubic-bezier easing)
  - `.text-gradient` / `.text-gradient-blue`: Gradient text effects
  - `.orb`: Parallax animated background orbs (mousemove + CSS animation)
  - `.bento-card`: Hover shadow effects
  - `.nav-blur`: Navbar backdrop blur on scroll
  - `.delay-*`: Staggered animation delays (100, 200, etc. classes)

### JavaScript Patterns
1. **Intersection Observer**: Detect `.reveal` elements in viewport → add `.active` class → apply CSS transitions
2. **Parallax orbs**: Track `mousemove` events, apply `transform: translate()` based on client X/Y position
3. **Navbar scroll listener**: Add/remove shadow class at scroll threshold (50px)
4. **Event delegation**: Filter buttons use `data-filter` attributes for session filtering

## CMS Integration (MicroCMS via Fetch API)

### Configuration
Located in `index.html` lines ~354-357:
```javascript
const CMS_CONFIG = {
    serviceDomain: 'YOUR_DOMAIN',  // e.g., 'my-translation-fest'
    apiKey: 'YOUR_API_KEY',        // e.g., 'xxxx-xxxx-xxxx-xxxx'
};
```

### Fetch Pattern
- **Endpoint**: `https://{serviceDomain}.microcms.io/api/v1/news?limit=3`
- **Header**: `X-MICROCMS-API-KEY: {apiKey}`
- **Fallback**: If config uses defaults ("YOUR_DOMAIN" / "YOUR_API_KEY"), displays hardcoded `dummyNews` array
- **Error handling**: Catches HTTP errors, displays dummy data if fetch fails

### News Rendering
- `renderNews(contents)` function processes API response
- Formats dates using `toLocaleDateString('ja-JP')`
- Applies category badges: '重要' (red), 'イベント' (blue), default (gray)
- Cards populate `#news-container` DOM element

## Bilingual Typography Strategy

- **Japanese text**: Noto Sans JP (weights 300-900)
- **English text**: Inter (weights 300-800)
- **Font loading**: Preconnect + display=swap for performance
- **Selector convention**: Use `lang="ja"` or language-specific classes if language-aware styling needed (currently implicit)

## Development Workflow

### Local Testing
```bash
# Python simple server (common choice)
python -m http.server 8000
# Then open: http://localhost:8000

# Or use any static server:
# Node: npx http-server
# VS Code: Live Server extension
```

### No Build Step
- Edit `.html` directly in IDE
- Changes live-reload with browser refresh
- CSS/JS embedded = no external asset compilation

### Common Tasks
1. **Add new section**: Copy existing `.reveal` structure with animation delay classes
2. **Modify CMS**: Update `CMS_CONFIG` object, refresh browser to test Fetch API
3. **Adjust animations**: Tweak `.reveal` transition duration, parallax orb speed multiplier in JS
4. **Update nav links**: Maintain consistent anchor references across all 4 HTML pages

## Code Style Conventions

- **Indentation**: 4-space tabs (consistent across HTML files)
- **Naming**: camelCase for JS variables/functions, kebab-case for CSS classes
- **Selectors**: Use data attributes for JS filtering (`data-filter="keynote"`)
- **Comments**: Mark major sections with `// --- 1. Animation Logic ---` style headers
- **Responsive breakpoints**: Use Tailwind's `md:` and `lg:` prefixes (mobile-first)
- **Color palette**: Gray (`#1d1d1f`, `#434344`), Blue (`#0071e3`, `#42a1ff`), with light backgrounds (`#f5f5f7`)

## Important Notes for AI Agents

1. **Preserve cross-page consistency**: Updates to nav, fonts, colors, animations should sync across all `.html` files
2. **Test dummy CMS mode**: Verify `dummyNews` displays correctly before configuring real MicroCMS credentials
3. **Mobile-first approach**: Always include `hidden md:flex` / `md:` utilities when adapting layouts
4. **No external state**: Each page is independent—use session/local storage if cross-page data needed
5. **Accessibility**: Maintain semantic HTML (`<nav>`, `<section>`, `<header>`), use FontAwesome icons with `<i>` tags (not for critical content)

## Key Files Reference

- [index.html](index.html) - Landing page + CMS logic
- [sessions.html](sessions.html) - Sessions/speaker directory
- [ticket.html](ticket.html) - Pricing & ticketing
- [mypage.html](mypage.html) - User dashboard (stub)
- [CLAUDE.md](CLAUDE.md) - Human-friendly project guide
