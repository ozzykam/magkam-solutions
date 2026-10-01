# Calculator repair and reactivation

Reviewed against the September 30, 2026 developer handoff:
https://claude.ai/artifact/Jqp1n6fDncK3mVEmT6kS68#631b0ab1-47ca

## Implemented

- Builder actions are explicitly non-submit buttons. Edit navigation waits for a successful save; validation errors remain visible.
- Shared pricing in `lib/calculator.ts` drives the browser, previews and submission API. The stored default hourly rate is authoritative, including for older definitions containing `hourly_rate`.
- Quantity defaults, limits, zero values, numeric select conditions, required answers and mandatory features are handled consistently.
- Features support descriptions, a quantity linked to a number field, and configurable visibility conditions. Select options support additional hours. Config fields support help text.
- Website page planning uses **Which pages does your website need?** with Home, About, Services, Products / Shop, Contact, FAQ, Blog / News, named additional pages and **I'm not sure yet**. Blog and Shop count once per section. The server derives the numeric count from these selections and saves both names and uncertainty in the lead/inbox message.
- Solution types have editable descriptions, two short examples and suggested pages. The selected type displays its guidance, with a collapsible comparison for all types. Suggestions do not select pages, add features or alter option prices.
- Each solution option also has a configurable starting package: included pages, included existing features, recommended optional features, and services covered by package setup hours. The visitor sees base estimate, additions and total; included controls are selected and locked. Recommendations remain optional. The server derives inclusions from the saved definition and retains package scope and the price split in both the lead and inbox message.
- Visitor-selected extras are kept separately from automatic inclusions. Switching solutions replaces automatic scope while preserving manual selections, without charging twice for overlapping pages/features. Package quantity features cannot fall below their default allocation. Package inclusion overrides feature visibility conditions; page work uses the effective page count.
- Visitors see a running estimate and dollar amounts per feature, review their choices, then enter contact details and consent for the full breakdown. This was the selected gate model.
- `/api/calculators/submit` validates answers, recomputes prices, retains config answers and labelled line items, and atomically saves the lead and inbox message. A honeypot and persistent five-per-minute IP limit protect submission. The limit uses Firestore and does not require Upstash.
- Rules disallow direct browser writes to calculator submissions and calculator-sourced inbox messages. Inactive calculator definitions are admin-only.
- Public pages respect the feature flag and show only active definitions. Service links resolve saved IDs to slugs; the service editor has a calculator picker.
- Calculator slugs are checked for duplicates before admin saves. This is an application-level check, not a transactional uniqueness guarantee for simultaneous admin saves.
- Admins can inspect leads and change their status at `/admin/calculators/submissions`. A saved calculator's Preview opens an admin-only page and never writes leads.

## Existing saved definitions

No production calculator definitions or settings were written as part of this code repair. Local browser inspection found the website calculator active, with calculator visibility and navigation both enabled. Its custom hours differ from the original template described in the handoff.

Existing configured hours and rates are retained. The retired visitor-controlled hourly rate is ignored automatically. The page-planning follow-up upgrades the original `num_pages` number field in memory to a page checklist and connects `landing_page_design` to that count when no other quantity source is explicitly configured. This changes total estimates with the number of selected pages, using the same per-page hours and hourly rate. Saving from the editor persists this upgraded definition.

1. Open the existing website calculator and review **Page design & development** and its quantity limits. Page count now comes from the checklist. Visitors begin with their package's included pages and may select extras or **I'm not sure about additional pages yet**. The latter uses the field's configured default count (clamped to its bounds and never below the included count), visibly labels it provisional, and flags it for consultation.
2. Expand **Digital Solution Type**, then review each **Starting package**. Enter approved **Package setup hours** for work beyond the separately priced page/feature allocation. Zero preserves the existing option surcharge; the editor highlights services listed without extra setup hours so their coverage can be reviewed. The saved options are Basic Website, Professional Website, E-Commerce Site, Small Business Solution and Enterprise Solution. No new hours or rates were invented for these saved choices.
   Each option also has editable guidance: description, examples (one per line), and suggested pages (one per line). Default guidance fills missing copy for the known solution types, while existing custom copy takes precedence. Additional page names can be entered through **Other** in the visitor checklist.
   Missing packages receive editable starters in memory: Basic includes Home/Contact; Professional includes Home/About/Services/Contact; E-Commerce includes Home/Shop/Contact with catalogue, cart, checkout and payment setup; Small Business includes Home/Services/Contact with quote request setup; Enterprise includes Home/Contact with discovery/workflow planning. Existing planning/page-design features are included when present, alongside globally mandatory features. Existing explicit packages take precedence. Saving the editor persists the reviewed package. These defaults affect the starting scope and therefore the total at the existing unit prices.
3. Review mandatory items, feature descriptions, quantities and rates. Remove unused or unfinished fields (the saved definition includes a field labelled **New Feature**) as appropriate.
4. Save, then use **Preview**. The preview banner identifies that no leads or messages are saved. Test page counts, solution types, quantities, conditions and the contact/results flow.

The new-calculator template uses the existing $150 rate and existing feature hours, links landing-page work to page count, and includes an example 40-hour e-commerce option surcharge. These are editable template values, not approved production pricing. The two-page informational template therefore starts at 170 hours / $25,500; the old flat template started at 130 hours / $19,500.

## Release order

1. Deploy the new web app/API with the existing `FIREBASE_SERVICE_ACCOUNT_KEY` and Firebase project configuration available on the server.
2. Deploy the calculator indexes from `firestore.indexes.json` and wait for them to finish building.
3. Deploy `firestore.rules`. These rules require the new API; old cached calculator pages may need a reload. Do not deploy Storage rules as part of this calculator change: `storage.rules` contains a pre-existing unrelated local change.
4. Review and save the existing definition as above. Confirm **Active**, **Feature Management → Calculators**, and **Show in navigation menu** have the desired values.
5. Smoke-test the public list and detail page, submit one intentionally identified test lead, and confirm its estimate matches the admin lead and inbox message. No real lead was created during automated/browser verification here.

Useful commands: `npm run typecheck`, `npm run test:calculator`. Run ESLint directly on changed files; the project's existing `npm run lint` still points to `next lint`, which is not the ESLint CLI used for this repair.

## Deferred product enhancements

Estimated price ranges/timelines, downloadable or emailed PDFs, and automatic Client/Project conversion are separate enhancements. Estimates remain non-binding planning estimates. The contact gate reveals the on-screen breakdown; it does not send an estimate email automatically.
