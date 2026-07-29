# Masroufi v2.1 fixes

- Fixed Add Store button by explicitly using `type="submit"` with the Base UI button component.
- Added visible server-action validation and error feedback to the store form.
- Added proper labels and autocomplete attributes.
- Reset the store dialog cleanly after closing or completing.
- Hardened Bills, Purchases, and delete forms with explicit submit button types.

## Why it happened

The project uses `@base-ui/react/button`. Unlike a native HTML `<button>` inside a form, its default behavior must not be relied on for form submission. Every server-action submit button is now explicit.
