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

## Changing Themes from `cursor.cfg`

The current cursor theme is stored in `EFI/PHILLOS/cursor.cfg` on the boot
media. Write `dark`, `light`, `1` or `0` to this file to control the pointer
color. The bootloader reads the value during startup and the kernel reloads it
after mounting the boot partition via `cursor_reload_cfg()`. This allows
changing the theme without rebuilding the ISO.

When `cursor_reload_cfg` executes the kernel logs messages similar to the other
configuration loaders:

```
cursor_reload_cfg: cursor.cfg missing
cursor_reload_cfg: malformed config
cursor DARK
```
