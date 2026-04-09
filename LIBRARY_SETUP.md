# Library Print Project Setup Guide

This project is a localized version of the PrintEase system, tailored specifically for the **RIT Library**.

## Key Changes Made
- **Branding**: All instances of "PrintEase" have been updated to "Library Print".
- **Roles**: "Shopkeeper" has been renamed to "Librarian" throughout the code and UI.
- **Database Schema**: The `shop_name` field has been renamed to `library_name`, and the `shopkeepers` table is now `librarians`.
- **Routes**: The `/shop` routes are now `/librarian` (e.g., `/librarian/dashboard`).
- **Structure**: Pages are now organized under `src/pages/librarian`.

## Getting Started

### 1. Database Setup
You will need a new Supabase project for this library instance.
1. Create a new project in [Supabase](https://supabase.com).
2. Go to the **SQL Editor** and run the contents of `schema.sql`.
3. Set up **Storage Buckets**:
   - Create a bucket named `library_print_files` and set it to **Public**.

### 4. Environment Variables
1. Copy `.env.example` to a new file named `.env`.
2. Fill in your new Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your-new-supabase-url
   VITE_SUPABASE_ANON_KEY=your-new-anon-key
   ```
3. Update other variables like `VITE_CAPSTONE_SHOP_MOBILE` with the library's contact info.

### 5. Installation & Development
```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Build for production
npm run build
```
