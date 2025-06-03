# Travel Tagger

Travel Tagger is a web application designed to organize and record trips by placing location-based "pins" on an interactive map. Its primary use case is to help users plan upcoming holidays or travels by mapping ideas for places to visit. A secondary use case is to log and visualize past trips.

## Target Featureset

- **Trip Management:** Create, view, and delete trips. Share trip with other users for collaboration.
- **Map-Based Pin Placement:** Add pins within trips by searching or clicking on the map.
- **Pin Organization:** Organise pins by reordering, nesting, and tagging with different attributes.
- **Multiple View Modes:** Map view and list view for different ways to manage your pins, with visualisations customised by pin attributes.
- **Trip Reporting:** Use metadata and pin data from trips to create visually pleasing trip reports, presenting locations in formats such as a map and timeline.

## Project Structure

This project uses a simplified, beginner-friendly structure:

```
├── src/
│   ├── app/                 # Next.js pages (direct URL mapping)
│   ├── components/          # React components (flat structure)
│   └── lib/                 # Utilities and contexts (flat structure)
├── config/                  # Build tool configurations
├── docs/                    # Documentation and database schema
├── public/                  # Static assets
└── package.json            # Dependencies and scripts
```

## Tech Stack

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS
- **Authentication:** Supabase Auth with Google OAuth
- **Database:** Supabase PostgreSQL
- **Maps:** Google Maps API, Places API

## Prerequisites

Before you can run this application, you'll need to set up the following:

1. **Google Cloud Platform Account**
   - Create a project and enable the following APIs:
     - Google Maps JavaScript API
     - Places API
     - Geocoding API
     - Google OAuth 2.0
   - Create API keys and OAuth credentials

2. **Supabase Account**
   - Create a new project
   - Set up the database schema using the provided `docs/supabase-schema.sql` file

## Getting Started

1. **Clone the repository**

```bash
git clone <repository-url>
cd trip-tagger
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory based on the `docs/.env.local.example` file.

4. **Run the development server**

```bash
npm run dev
```

5. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## Current Progress

- Sign up and login with local application account or Google OAuth
- Dashboard (my trips) page, where users can add new trips to their account with an optional start and end date
- Trip page, where user can place pins on map, and add attributes to them.
- Bulk pin edit interface, for editting pins in a data grid.

## Next 3 features

1. Add other users to trip as editor with share link.
2. Map view parameters, such as ability to adjust legend field.
3. Optimisation review.