# Custom Cursor Themes

PhillOS supports customizable cursor themes. The active theme is stored on the backend in `cursor.cfg` and synchronized with the frontend through `/api/cursor`.

## Adding Themes

1. Place SVG files for your cursors under `src/assets/cursors/`.
2. Update `CursorContext` to import the new SVGs and expose them as options.
3. Provide a name for the theme in `CursorSettingsView`.

SVGs are imported with the `?url` suffix so Vite inlines them as data URIs for optimal performance.

## Integration with Light/Dark Theme

By default PhillOS ships with `arrow_light.svg` and `arrow_dark.svg` which pair with the light and dark UI themes. The cursor URL is applied via the CSS variable `--phillos-cursor` in `index.css` and updated whenever the theme changes.

Users can switch cursor themes from **Settings → Cursor Settings**.
