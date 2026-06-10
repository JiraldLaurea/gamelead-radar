# GameLead Radar Design Standards

This project uses a restrained operational dashboard style: clear hierarchy, dense tables, predictable controls, and minimal decoration. The UI should feel fast, structured, and calm.

## Layout

- Use the persistent left sidebar for primary navigation.
- Main content uses a light gray page background with white surfaces for controls, tables, and modals.
- Page headings should be direct and functional. Supporting copy should be short and muted.
- Use full-width content areas for operational workflows. Avoid decorative marketing-style sections.
- Keep spacing compact and consistent. Prefer `16px` and `24px` rhythm for page and panel spacing.

## Surfaces

- Cards and panels use `8px` border radius unless an existing component has a specific radius.
- Avoid nested cards. Use panels for major grouped controls, not for every small block.
- Tables may use their own framed scroll container. Do not wrap the Leads table in an additional panel unless the workflow needs a surrounding toolbar or context block.
- Use `box-shadow: var(--paper-edge)` for normal raised surfaces.

## Color

- Primary action color is teal: `var(--accent)` / `#0f766e`.
- Text uses `var(--ink)` for primary content and `var(--muted)` for secondary content.
- Borders use `var(--line)`.
- Success, warning, and danger states should use the existing badge and notice color patterns.
- Avoid new broad color palettes unless the domain requires it. Keep new UI aligned with the existing teal, gray, white, and status-color system.

## Typography

- Use the project font family through `var(--font-family)`.
- Keep dashboard copy at practical sizes:
  - Page titles: around `24px`
  - Section titles: around `18px` to `20px`
  - Body/table text: around `14px`
  - Helper text: around `12px` to `13px`
- Do not use hero-scale type for operational screens.

## Buttons

- Primary buttons use `.button` with teal background.
- Secondary buttons use `.button.secondary`.
- Destructive actions use `.button.danger`.
- Icon buttons should use `.icon-button`.
- Buttons should include icons for common actions where the surrounding UI already does so.
- Disabled buttons should remain visible, with reduced opacity and no pointer interaction.

## Forms

- Inputs, selects, and textareas use `8px` radius, `var(--line)` borders, and white backgrounds.
- Filters should be compact and horizontally arranged on desktop, collapsing cleanly on smaller screens.
- Switches use the existing `.switch-field`, `.switch-track`, and `.switch-thumb` pattern.

## Tables

- Tables are central to the product. They should be dense, scannable, and stable while scrolling.
- Use sticky table headers for long tables.
- Use a sticky subheader directly below the column header to show item count and selected count:
  - Example: `100 leads • 0 selected`
- Selection checkboxes belong in the first column.
- Keep selected counts inside the table subheader, not duplicated in external action bars.
- Row hover states should be subtle and use the existing pale teal background.
- Truncate long one-line values with existing helpers such as `.truncate-cell` or `.one-line-cell`.
- Empty states should appear inside the table body as a full-width row.

## Modals

- Standard modals use `.modal` with a sticky header and footer.
- Confirmation modals should clearly state what will be deleted or changed.
- Loading modals use `.loading-modal`, `.loading-modal-body`, and `.loading-modal-actions`.
- Loading spinners use `.loading-spinner`; change the spinner color only when needed for the context.
- Modal backdrops should dim the app without changing the modal layout.

## Snackbars And Notices

- Use snackbars for operation completion and short feedback after user actions.
- Snackbar success uses a black background with white text.
- Use inline `.notice` only when feedback must remain visible in page context.
- Avoid persistent success notices after the user has moved on, unless they explain current state.

## Automation Status

- The automation top bar should only appear for active, paused, blocked, or scheduled automation states.
- If automation is canceled or disabled, remove the top bar and show a relevant snackbar.
- Scheduled automation should explain that it is waiting for its time window, not that it is blocked.

## Accessibility And Interaction

- Use real buttons for actions and links for navigation.
- Icon-only controls need accessible labels.
- Preserve keyboard behavior for checkboxes and clickable rows.
- Avoid layout shift when loading or changing selected rows.
- Keep destructive actions behind confirmation when they permanently remove data.

## Implementation Guidance

- Prefer existing classes before adding new styles.
- Add small shared classes for repeated UI behavior, especially table and modal patterns.
- Keep CSS scoped by component class names when changing a specific screen.
- Avoid inline styles except for temporary or highly localized layout needs.
- Match the current visual system before introducing new abstractions.
