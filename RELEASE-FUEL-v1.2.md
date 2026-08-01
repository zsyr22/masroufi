# Fuel v1.2 — UAE station branding

- Replaced free-text station input with a fixed dropdown.
- Added ENOC, ADNOC, and Emarat station master data in Supabase.
- Added official SVG logos to the form, history cards, and details page.
- Added subtle station-colored card borders and elevated logo containers.
- Replaced the generic “AD / EN / EM” initials.
- Renamed the list counter area to “Fuel history”.

## Required database command

```bash
npx supabase db push
```

Migration: `026_create_fuel_stations.sql`
