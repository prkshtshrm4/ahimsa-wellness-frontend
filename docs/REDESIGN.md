# Ahimsa redesign — September 2026

## Direction and implementation plan

1. Keep the existing React/Vite app and the booking, login and staff routes.
2. Introduce a warm ivory / forest-green public design system, editorial serif typography and generous space.
3. Lead with Dr Pandey’s actual portrait, then a short sourced career story.
4. Use Three.js for restrained botanical forms and rings around the portrait. Keep all information and navigation in semantic HTML; provide pause, reduced-motion, data-saving and WebGL fallback behaviour.
5. Present therapies with supplied photography, accessible filters and native modal details. Avoid unsupported efficacy claims and invented reviews, patient totals or affiliations.
6. Introduce the real centre with optimized photographs and a user-initiated short exterior video.
7. End with first-visit FAQs, directions, social profiles and existing online booking. Keep unknown operational details out of the public copy.
8. Verify production build, desktop/mobile rendering, filters, dialogs, video, route navigation and the unavailable-booking state.

## Design research

- https://discourse.threejs.org/t/suhha-a-cinematic-three-js-teaser-site-for-a-japanese-wellness-bath-aroma-brand/92199 — the creator describes quiet Three.js atmosphere as part of a wellness brand. Borrow the restraint, not the assets or layout.
- https://springs.estate/ — nature-led wellness storytelling, large typography and generous pacing. Adapt the calm editorial hierarchy to a local care centre.

## Content provenance

Retrieved 22 September 2026 from https://drsnpandey.net/ and https://drsnpandey.net/about-drsnp/.

The biography describes joining CCRYN in 1980, serving there for over 27 years until retirement in 2008, and serving as Principal of Government Naturopathic Medical College, Hyderabad, from 1982 to 1985. These are the historical details used on the site. The biography also describes education and publications in yoga, naturopathy and lifestyle intervention. It is a self-published biography, not independent verification.

Portrait source: https://drsnpandey.net/wp-content/uploads/2021/08/WhatsApp-Image-2021-07-27-at-9.28.21-PM.jpeg . Reused under the user's instruction to source the website; optimized locally without changing the subject.

All therapy photographs come from the branding team's `Pictures ` directory (the directory name has a trailing space). They are illustrative photographs and are labelled as such. Building photo and exterior film come from `building_and real_pictures`. Originals are unchanged. Film audio is removed; playback is user initiated and native controls remain available.

World Peace Centre / Sector 39 / Gurugram was retained from the existing site; the building photograph confirms the World Peace Centre signage. The previous phone number and opening times appeared unconfirmed and were removed. The Instagram and Facebook destinations were provided in the user's brief.

## Content still needing the centre's input

- Exact AIIMS, RML and “haas” institution names, roles, dates and supporting source. The supplied biography does not establish these claims, so they are not published.
- Confirmed centre telephone, email and opening hours.
- Replacement mud-therapy and magnetotherapy photographs: supplied files appear to show chocolate treatments and electrostimulation. Do not relabel those treatments in public imagery.
- Higher-resolution, professionally shot Dr Pandey portrait would improve the hero; the supplied source is relatively soft.

## Runtime

Run `npm install`, then `npm run dev`. `npm run build` creates the production bundle. Three.js is a separate dynamic import and is skipped for reduced-motion/data-saving preferences; the static portrait and halo remain visible.

Booking still requires the existing `/v1` API, Firebase configuration, and payment infrastructure. The redesign does not create demo bookings or invent live availability. The booking page now shows a retry state when services cannot be loaded instead of an empty screen.

## Validation completed

- Production build passes. Three.js is emitted as a separate chunk; Vite reports its standard large-chunk advisory.
- Desktop hero visually inspected in the in-app browser.
- 390 × 844 mobile layout checked: no horizontal overflow and no broken loaded images.
- Movement filter returns yoga and physiotherapy; therapy modal opens and closes via Escape.
- Additional mud-therapy dialog opens with the correct text; native modal focus returns to its trigger.
- Exterior video loads and plays (4.88 seconds, no media error).
- Mobile menu opens, links to the therapies anchor, and closes after navigation.
- FAQ expands; booking CTA reaches `/book`.
- Unavailable local API produces the explicit retry state. Live authentication, appointment creation and payment have not been exercised because the backend is not running.
- The installed legacy dependency tree reports npm audit findings (13 moderate, 5 high). No forced major dependency upgrades were included in this design change.

## Silent background film refinement

The exterior clip now also appears as a low-contrast architectural layer behind the opening and a full-width centre section with a directional dark overlay. A 13.17-second forward/reverse loop slows the original movement and avoids an abrupt reset. `centre-atmosphere.mp4` is approximately 1.9 MB and contains only a video stream; its audio track is removed.

BackgroundFilm loads its source only when visible, pauses outside the viewport or in a hidden tab, and falls back to a still for reduced-motion/data-saving preferences and playback failures. Shared atmosphere controls pause both video and Three.js; opening the film or therapy dialog suspends background motion. The original short film remains available in the dialog.

Three.js leaves have curved geometry, subtle light response and gentler movement. Animation timing is frame-rate independent; animation scheduling stops while paused, hidden or off-screen. Navigation is now sticky with a translucent background, and anchor offsets account for the header on mobile.

Verified in browser: muted background autoplay, off-screen suspension, shared pause/resume, dialog background suspension, and 390 px mobile overflow. ffprobe confirms the background loop has no audio stream. Production build passes.

## Media optimization before repository push

Replaced the generated website JPEGs with WebP assets and 480 px responsive variants for therapy cards. Gallery cards select an appropriate image using `srcSet` / `sizes`; their existing lazy loading remains in place. The portrait and poster use optimized WebP. Removed two unused generated building photographs; the branding team's source files remain unchanged outside the repository.

Total image files in `public/assets/wellness`: 2,110,550 bytes before, 405,622 bytes after (including mobile variants), approximately 81% smaller. The background MP4 is now 747,800 bytes, down from 1,875,387 bytes; the original short film is 623,139 bytes. Both are silent H.264 with fast-start metadata. The shared JPEG logo is also resized for its small display dimensions.
