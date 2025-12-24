# Quick Start Guide - Sharing System

## Installation Steps

1. **Install Dependencies**
   ```bash
   cd brands/act-frontend
   pnpm install
   ```
   This installs `bcryptjs` and `@types/bcryptjs` needed for password protection.

2. **Run Database Migrations**
   ```bash
   # From project root
   supabase db push
   
   # Or if that doesn't work:
   supabase migration up
   ```
   This creates:
   - `visibility` column on `projects` table
   - `share_tokens` table with all features
   - Database functions for token validation

3. **Start Development Server**
   ```bash
   cd brands/act-frontend
   pnpm dev
   ```

4. **Test the Features**
   - Open http://localhost:3000
   - Navigate to chat
   - Hover over a conversation
   - Click "…" menu → "Share"
   - Try both team sharing and public link generation

## What Was Built

### Team Sharing
- Toggle conversations between Private and Shared (brand members only)
- Copy internal URLs for team collaboration
- Works on desktop and mobile

### Public Link Sharing
- Generate unique public share links
- Anyone with link can view (no login required)
- Read-only access
- Optional features (backend ready, UI can be added):
  - Password protection
  - Expiration dates
  - View limits

### Technical Details
- 2 new database migrations
- 1 new API route (`/api/share`)
- 1 new public route (`/s/[token]`)
- Enhanced share dialogs with dual-mode UI
- Mobile support through chat header
- All RLS policies updated for security

## Files Changed
- **Created (4)**: 2 migrations, 1 API route, 1 public page
- **Modified (6)**: chat page, container, sidebar, header, project sidebar, package.json

## Next Action
Run the installation steps above, then refer to `SHARING_IMPLEMENTATION.md` for detailed testing instructions and architecture overview.

