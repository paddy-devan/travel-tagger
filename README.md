# Trip Tagger

Trip Tagger is a web application designed to organize and record trips by placing location-based "pins" on an interactive map. Its primary use case is to help users plan upcoming holidays or travels by mapping ideas for places to visit. A secondary use case is to log and visualize past trips.

## Features

- **Google Account Login:** Users authenticate using their Google account via OAuth
- **Trip Management:** Create, view, and delete trips
- **Map-Based Pin Placement:** Add pins by searching or clicking on the map
- **Pin Organization:** Reorder pins, add attributes like visit dates, categories, and notes
- **Multiple View Modes:** Map view and list view for different ways to manage your pins

## Tech Stack

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS
- **Authentication:** NextAuth.js with Google OAuth
- **Database:** Supabase
- **Maps:** Google Maps API

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
   - Set up the database schema using the provided `supabase-schema.sql` file

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

Create a `.env.local` file in the root directory based on the `.env.local.example` file.

4. **Run the development server**

```bash
npm run dev
```

5. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## Database Schema

### Users Table
- `id`: Primary key
- `email`: User's email (unique)
- `name`: Display name
- `avatar_url`: URL to user's profile image

### Trips Table
- `id`: Primary key
- `user_id`: Foreign key linking to Users
- `name`: Name of the trip
- `start_date`: Optional start date
- `end_date`: Optional end date
- `created_at`: Timestamp
- `updated_at`: Timestamp

### Pins Table
- `id`: Primary key
- `trip_id`: Foreign key linking to Trips
- `latitude`: Coordinate
- `longitude`: Coordinate
- `google_maps_id`: Optional ID for place lookup
- `nickname`: Custom name for the pin
- `visited_flag`: Boolean marker
- `category`: Optional location category
- `start_date`: Optional scheduling date
- `end_date`: Optional scheduling date
- `notes`: Free-text field
- `parent_pin_id`: Optional for hierarchical nesting
- `order`: For sequence ordering
- `created_at`: Timestamp
- `updated_at`: Timestamp

## License

This project is licensed under the MIT License.
