# Arabic Youth Library — Claude Instructions

## Documentation Maintenance (Required After Every Task)

After completing any code change (feature, bugfix, refactor), you MUST update the project documentation before reporting done:

1. **Memory files** (in `.claude/projects/.../memory/`):
   - `MEMORY.md` — Update if new conventions, patterns, or preferences were established
   - `architecture.md` — Update if architectural patterns, workflows, or conventions changed
   - `file-map.md` — Update if files were created, deleted, renamed, or their purpose changed significantly

2. **What to update**:
   - New files → add to file-map.md with purpose description
   - New patterns (responsive, modal, state management) → add to architecture.md
   - New tech choices or conventions → add to MEMORY.md
   - Changed file responsibilities → update existing entries in file-map.md

3. **Rules**:
   - Keep descriptions concise — one line per file in file-map, bullet points in architecture
   - Don't duplicate info across files — MEMORY.md has overview, architecture.md has details
   - Remove outdated info when things change (don't leave stale descriptions)
   - Translation keys don't need documenting individually — just note the language files exist

## Code Conventions

- Always run `npm run build` in `client/` after frontend changes to verify no errors
- Use `md` as the responsive breakpoint for mobile/desktop splits
- Use `start-*`/`end-*` instead of `left-*`/`right-*` for RTL support
- Use `cursor-pointer` on all interactive elements, `cursor-default` on modal panels
- All modals: backdrop with `cursor-pointer` + `onClick` close, panel with `stopPropagation`
- Use `HiOutline*` icons from `react-icons/hi2` (never `hi` v1)
- Tailwind CSS v4 — no `tailwind.config.js`, uses `@tailwindcss/vite` plugin
