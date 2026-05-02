export const posts = [
  {
    title: "Building a real-time token screener on Base with Goldsky pipelines",
    date: "Apr 2026",
    mins: "8 min",
    tag: "crypto",
    col: "#F0B429",
    slug: "token-screener-base-goldsky",
    excerpt: "How I built Token Radar: streaming live on-chain events from Base into PostgreSQL with Goldsky Mirror, then pushing updates to the browser over WebSockets, and the deduplication gotchas nobody warns you about.",
  },
  {
    title: "Payment integrations in Nigeria: Paystack, VFD, Polar.sh, and what nobody documents",
    date: "Mar 2026",
    mins: "12 min",
    tag: "fintech",
    col: "#00e07a",
    slug: "nigeria-payment-integrations",
    excerpt: "Years of integrating Nigerian payment rails in production. The stuff that's in the docs, the stuff that isn't, and the things you only learn when a webhook fires at 2am and a customer is missing money.",
  },
  {
    title: "Idempotent transaction design: how to never double-charge a user",
    date: "Feb 2026",
    mins: "10 min",
    tag: "backend",
    col: "#7b8cff",
    slug: "idempotent-transactions",
    excerpt: "A payment webhook fired twice. The user got charged twice. Here's the database-level pattern I now use on every financial system so it can never happen again.",
  },
  {
    title: "From enterprise ColdFusion to Node.js microservices: what I learned",
    date: "Jan 2026",
    mins: "7 min",
    tag: "career",
    col: "#ff8c69",
    slug: "coldFusion-to-nodejs",
    excerpt: "My first production codebase was ColdFusion. Here's what that taught me about server-side rendering, session design, and why the strangler fig pattern beats every rewrite I've ever seen attempted.",
  },
];

export const terminalCommands: Record<string, string> = {
  help: `available commands:
  whoami:      about obed
  ls:          list projects
  cat stack:   full tech stack
  experience:  work history
  hire:        work with me
  ping:        test connection
  clear:       clear terminal
  exit:        close`,

  whoami: `Obed Ugwu, senior backend engineer. Lagos, Nigeria.
7+ years shipping production systems across fintech, music 
distribution, telecom, and e-commerce.

Self-taught. No CS degree. Just systems that work at 3am in prod.
Currently: Lead Backend @ SongDis + building Token Radar.`,

  ls: `drwxr-xr-x  SongDis/        music distribution SaaS (active)
drwxr-xr-x  Zenfinder/      service marketplace app (active)
drwxr-xr-x  TuneAlart/      AI music detection platform (active)
drwxr-xr-x  TokenRadar/     Base blockchain screener (active)
drwxr-xr-x  Rytiva/         order-to-cash middleware
drwxr-xr-x  Zikor/          multi-vendor storefront
drwxr-xr-x  Wami/           creatives marketplace
drwxr-xr-x  ADP-VTU/        telecom VTU platform`,

  "cat stack": `Node.js / TypeScript  ████████████████  primary
Laravel / PHP 8      █████████████░░░  primary
AWS (EC2/RDS/S3)     ████████████░░░░  infrastructure
Docker + CI/CD       ████████████░░░░  deployment
PostgreSQL / MySQL   ██████████░░░░░░  databases
Redis                ████████░░░░░░░░  cache / queues
Paystack             ██████████░░░░░░  payments
VFD Microfinance     ████████░░░░░░░░  payments
Polar.sh             ██████░░░░░░░░░░  international billing
Xpress Wallet        ██████░░░░░░░░░░  wallet ops`,

  experience: `Senior roles:
  Lead Backend Eng @ SongDis            2024–Present
  Backend Eng      @ Sterling Tech       2024–2026
  Fullstack Dev    @ Combs & Clippers    2025 (contract)
  Backend Eng      @ Printivo            2023–2024
  Node.js Eng      @ Wano (fintech)      2022–2023
  Software Dev     @ IntelYtics          2019–2022`,

  hire: `available for:
  → Senior backend contracts (remote)
  → Full-time senior backend roles (remote)
  → Payment/fintech API integration
  → SaaS architecture & builds

timezone:      WAT (UTC+1), Lagos, Nigeria
               (onsite available: Victoria Island)
response time: < 24h

→ obedugwuv@gmail.com
→ linkedin.com/in/obed-ugwu-81a568180`,

  ping: "PONG. 1ms. all systems live.",
};
