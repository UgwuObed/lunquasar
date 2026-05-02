# lunqausar — Personal Site

A dark, terminal-aesthetic personal site built with Next.js 15 (App Router) + TypeScript.

## Stack
- **Next.js 15** — App Router
- **TypeScript** — strict mode
- **CSS Modules** — component-scoped styles
- **Google Fonts** — Syne (display) + JetBrains Mono (code/UI)

## Getting started

```bash
npm install
npm run dev
# → http://localhost:3000
```

## Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
```

Or connect your GitHub repo directly at vercel.com. Zero config needed.

## Structure

```
src/
├── app/
│   ├── layout.tsx        # root layout + metadata
│   ├── page.tsx          # home page, terminal shortcut
│   └── globals.css       # CSS variables, base styles
├── components/
│   ├── Nav.tsx / .css    # fixed nav, scroll-aware
│   ├── Hero.tsx / .css   # full-height hero
│   ├── Stats.tsx / .css  # count-up animation stats
│   ├── Portfolio.tsx     # project cards
│   ├── Experience.tsx    # accordion work history
│   ├── Blog.tsx          # post teasers
│   ├── Now.tsx           # /now page style section
│   ├── WorkWithMe.tsx    # hire section
│   ├── Footer.tsx        # links + terminal hint
│   └── Terminal.tsx      # easter egg terminal (ctrl+`)
└── data/
    ├── projects.ts       # project data
    ├── experience.ts     # work history
    └── content.ts        # blog posts + terminal commands
```

## Customising

- Update `src/data/projects.ts` when you ship new things
- Update `src/data/experience.ts` for new roles
- Update `src/data/content.ts` for new blog posts + terminal commands
- Swap `obedugwuv@gmail.com` and social links in `WorkWithMe.tsx` / `Footer.tsx` with real handles
- Add real project URLs in `projects.ts`
- Update metadata in `layout.tsx` when you have a real domain

## Terminal easter egg

Hit `ctrl+\`` anywhere on the site to open the terminal.
Commands: `help`, `whoami`, `ls`, `cat stack`, `experience`, `hire`, `ping`, `clear`, `exit`

## Blog

The blog posts are currently mocked. To add real blog posts:
1. Create `src/app/blog/[slug]/page.tsx`
2. Write posts as MDX (install `@next/mdx`) or in a CMS like Sanity/Contentlayer
3. Update `src/data/content.ts` with real slugs
