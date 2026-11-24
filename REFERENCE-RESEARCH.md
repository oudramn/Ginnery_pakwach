# The Ginnery Signature Redesign — Reference Research and Product Decisions

## Research direction

The design borrows broad interface patterns from premium hotel and safari-lodge websites; it does not copy their branding, copywriting, or exact page layouts.

- **Kampala Serena Hotel** — the official site combines a visible room-booking flow with dining discovery and separate table reservations; its home page includes accommodation, dining and facilities information. https://www.serenahotels.com/kampala/ and https://www.serenahotels.com/kampala/book-a-table
- **One&Only Royal Mirage, Dubai** — its dining pages make restaurant concepts and reservation actions distinct, and include private-dining enquiries. https://www.oneandonlyresorts.com/royal-mirage and https://www.oneandonlyresorts.com/royal-mirage/dining
- **Emirates Palace Mandarin Oriental, Abu Dhabi** — uses a distinct dining index with venue categories, service details and table-booking actions. https://www.mandarinoriental.com/en/abu-dhabi/emirates-palace/dine
- **Qasr Al Sarab by Anantara, Abu Dhabi** — leads with landscape and place, then organises accommodation, experiences and practical stay information. https://www.anantara.com/en/qasr-al-sarab-abu-dhabi
- **Cheval Blanc** — destination-led editorial storytelling across stays, dining and wellbeing. https://www.chevalblanc.com/en/
- **Singita** — nature-led lodge storytelling and a guest-planning / enquiry journey. https://singita.com/lodges/ and https://singita.com/2021/02/singita-announces-new-digital-experience/
- **&Beyond** — experience-led safari storytelling with place and guided trip-planning concepts. https://www.andbeyond.com/

## How the research shows up in this concept

1. A cinematic opening, restrained menu, premium serif typography and generous image space.
2. A strong “book / enquire” route that remains available while the guest explores.
3. Four different request flows: accommodation, restaurant, bar and events. Restaurant/bar/events requests do not require a room reservation.
4. A common guest profile step with contact details, reply-language choice, UGX/USD quote preference and payment preference.
5. Local-guest pathway for restaurant visits, birthdays, weekend stays, business lunches, private gatherings and corporate/event enquiries.
6. International guest pathway for airport-transfer requests, travel information and trip details.
7. General official links for Uganda's electronic visa/immigration portal and CAA Entebbe airport information. https://ecompliance.immigration.go.ug/ and https://caa.go.ug/entebbe-international-airport/
8. An administrative dashboard concept for request review, demo workflow statuses, CSV export, draft offers/content, staff role previews and basic counts.
9. A motion storyboard to inspect the animation sequence separately from the main site.

## Booking design / truth boundaries

A form alone cannot ensure room availability. This build currently receives requests and stores them in a local SQLite demo database when launched with Flask (or in browser-local storage in static preview mode). It does not yet check room inventory, prevent double bookings, calculate verified totals, take payments, send hotel email/WhatsApp messages or integrate with a property-management system (PMS), channel manager, table inventory or payment provider. Production requires owner-approved rates, taxes, occupancy rules, cancellation/refund conditions, payment methods, integrations and privacy terms.

The sample currency selector records a preference for a quote in UGX or USD; it does not invent prices or exchange-rate conversions. Payment options (card, Mobile Money, bank transfer or pay-at-property) are collected only as preferences subject to hotel confirmation, not claims of acceptance.

## Asset and address limitations

The existing public website source/media could not be retrieved directly in this environment. The included photographs are remote editorial placeholders, not verified property photographs. Replace them with owner-approved media. The user described the property as in Apac, while some public search snippets also use Pakwach. The concept labels the location “Northern Uganda” until the owner confirms the exact locality/address.
