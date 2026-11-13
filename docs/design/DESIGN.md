# Affiliate Manager – Design Spec

Source of truth for the UI. The mockups in `docs/design/screens/*.dc.html` are
static HTML exports of the approved design (inline styles). Use them as a
**visual reference** only: rebuild each screen with Next.js App Router +
shadcn/ui (Radix) + Tailwind. Do NOT copy the `.dc.html` runtime syntax
(`{{ }}`, `<sc-if>`, `<x-dc>`, `support.js`) into the app.

UI copy is Vietnamese (as in the mockups). Code, identifiers and comments are English.

## Screens → routes

| Mockup file | Route | Purpose |
|---|---|---|
| `Main.dc.html` | `/dashboard` | KPI cards, today's posting timeline, "Cần xử lý" (failed posts with retry), channel health |
| `Deals.dc.html` | `/dashboard/deals` | Deal table: filter tabs by status, search, marketplace select, pagination |
| `DealEditor.dc.html` | `/dashboard/deals/new`, `/dashboard/deals/[id]` | Deal form (3 sections) + live preview tabs (Facebook / Telegram / Bio) |
| `Schedule.dc.html` | `/dashboard/schedule` | Post queue grouped by day, failed-posts panel with error reason + retry |
| `Channels.dc.html` | `/dashboard/channels` | Channel cards (Facebook pages, Telegram, Bio link) with status + test post |
| `Bio.dc.html` | `/bio` (public, mobile-first) | Search, category chips, sort/filter chips (biggest discount, under 200k, expiring soon, newest), "Deal hôm nay" featured card with countdown, per-deal personal note, discount badge, "price checked at", copy-code button, Telegram follow block, affiliate disclosure |

All `/dashboard/*` routes share one layout: dark sidebar (232px) + content area.
On narrow screens the sidebar stacks above the content (or becomes a Sheet).

## Design tokens

Map these into `globals.css` shadcn CSS variables (light theme only for now).

| Token | Hex | Use |
|---|---|---|
| background | `#F6F7F9` | page background |
| card | `#FFFFFF` | cards, tables |
| border | `#E4E7EC` | card/table borders |
| border-strong | `#D0D5DD` | inputs, secondary buttons |
| foreground | `#101828` | main text |
| muted-foreground | `#475467` | secondary text (passes 4.5:1 on white) |
| subtle | `#667085` | placeholders, empty values |
| primary | `#C2410C` | primary buttons, links, accent |
| primary-hover | `#9A3412` | hover |
| primary-soft | `#FFF1E8` / border `#FDBA8C` | selected channel rows, soft buttons |
| sidebar | `#101828`, active item `#1D2939`, text `#D0D5DD` | navigation |

Status badges (pill, 12px/600, padding 4px 10px):

| Status | Text | Background |
|---|---|---|
| Đang chạy / Đã đăng / Hoạt động | `#067647` | `#ECFDF3` |
| Chờ đăng / Đã lên lịch | `#175CD3` | `#EFF8FF` |
| Lỗi | `#B42318` | `#FEF3F2` (border `#FECDCA`) |
| Hết hạn / Cần kết nối lại | `#B54708` | `#FFFAEB` |
| Nháp | `#344054` | `#F2F4F7` |

Typography: body **Inter** (400/500/600/700), headings **Space Grotesk** (600/700),
both via `next/font/google` with the `vietnamese` subset.
Sizes: page title 30px/700, section title 18px/600, body 14px, meta 13px, badge 12px.

Shape and spacing: cards radius 14px, inputs/buttons radius 10px, small buttons 8px,
pills 999px. Page padding 32px 40px. Gaps: 24px between sections, 16px in grids.
Minimum touch target 44px (40px for compact row actions).

Icons: `lucide-react`, stroke style, 18px in nav/buttons.
Mockup icon → Lucide: dashboard `LayoutDashboard`, deals `Tag`, schedule `CalendarDays`,
channels `Link2`, bio `Smartphone`, add `Plus`, search `Search`, Facebook `Facebook`,
Telegram `Send`.

## Component mapping (shadcn/ui)

- Cards → `Card`; KPI cards = `Card` with label, big number (Space Grotesk 34px), hint line
- Status pills → `Badge` with custom variants: `success`, `info`, `danger`, `warning`, `neutral`
- Filter tabs → `Tabs` (segmented look: muted track `#EAECF0`, white active tab)
- Deal table → `Table` inside a horizontally scrollable wrapper; pagination buttons
- Selects → `Select`; search → `Input` with a leading `Search` icon
- Deal form → `react-hook-form` + `zod` + shadcn `Form`, `Input`, `Textarea`, `Checkbox`
- Date/time → `Popover` + `Calendar` + time input (or native `datetime-local` first)
- Preview tabs in editor → `Tabs` with three `TabsContent` panels
- Toasts → `sonner` ("Đã đưa vào hàng đợi đăng lại", "Đã sao chép mã")
- Mobile sidebar → `Sheet`

## Behaviour notes

- Facebook posts never include the link in the caption; the link goes into a pinned comment.
- Each (deal × channel) is one `Post` with its own scheduled time and status
  (`PENDING`, `PUBLISHED`, `FAILED`); failed posts show a human-readable reason and a retry action.
- Channel tokens live only on the server (encrypted). The UI never displays them.
- Bio page shows only deals that are active and opted in to Bio; footer keeps the affiliate disclosure.
- Deal has an optional short `note` (owner's own comment, shown as "Nhận xét của mình") and an
  `isFeatured` flag (shown in "Deal hôm nay" with a countdown to `expiresAt`).
- Show `priceCheckedAt` on the Bio page ("giá kiểm tra lúc …"); never show stale prices without it.
- Do not scrape marketplace pages; deal data is entered manually from the Shopee Affiliate portal.
- Data in the mockups is sample data; fetch real data from the database.
