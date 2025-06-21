# Custom Cursor Themes

PhillOS supports customizable cursor themes. The active theme is stored on the backend in `cursor.cfg` and synchronized with the frontend through `/api/cursor`.
The built-in styles are **Default** (a simple arrow) and **Mac**.

## Adding Themes

1. Place SVG files for your cursors under `src/assets/cursors/`.
2. Update `CursorContext` to import the new SVGs and expose them as options.
3. Provide a name for the theme in `CursorSettingsView`.

SVGs are imported with the `?url` suffix so Vite inlines them as data URIs for optimal performance.

## Integration with Light/Dark Theme

By default PhillOS ships with `arrow_light.svg` and a Mac-inspired `mac.svg`. The cursor graphic is rendered at the pointer position by the `Cursor` component and the system cursor is hidden via CSS.

Users can switch cursor themes from **Settings → Cursor Settings**.
