# Product Context

## Users
Warehouse staff, small team (~5 people), Vietnam-based, work on desktop

## Product Purpose
Convert inbound Excel manifests (QUY RA SỐ KHỐI) into Haravan e-commerce order format. Handles 3N→1N SKU mapping (e.g., 3 case \u00d7 5 g\u00f3i = 1 th\u00f9ng).

## Platform
Web app: NestJS backend + React frontend, served from single Render deployment

## Principles
- Vietnamese UI, clean and functional
- Desktop-first, no authentication (internal tool)
- One action per screen
- Show clear status for each row (success/error/warning)
- Fast feedback on upload and processing

## Accessibility
- Target: 20px minimum touch targets
- High contrast for data tables
- Keyboard navigable
