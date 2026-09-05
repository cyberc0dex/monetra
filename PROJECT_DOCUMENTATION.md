# Monetra Project Documentation

## 1. Project overview

Monetra is a mobile-first personal finance and activity tracking Progressive Web App (PWA). It combines four personal tracking areas in one interface:

- Account balances
- Purchase value over time
- Vehicle loan progress
- Scheduled and past activities

The application is intentionally local and private. It has no user authentication, backend, cloud synchronization, analytics, or remote database. User data remains in browser storage on the current device.

## 2. Product and technical goals

Monetra was designed around the following choices:

- Mobile is the primary display target.
- Wider tablet and desktop displays contain the application within a `430px` maximum-width shell.
- The application uses vanilla HTML, CSS, and JavaScript.
- There is no framework, compiler, bundler, or required production build step.
- GitHub Pages can host the contents as a static website.
- Production mode is installable and works offline as a PWA.
- Development mode avoids persistent state and caching so repeated testing starts cleanly.
- All monetary values use a `$` prefix and standard US number formatting, such as `$12,500.00`.

## 3. Out-of-scope capabilities

The current design intentionally excludes:

- Authentication and user accounts
- Cloud backup or synchronization
- Server-side processing
- Analytics or telemetry
- Multiple currencies or currency conversion
- Interest-rate and amortization calculations
- Notifications and calendar integration

## 4. Technology stack

| Area | Implementation |
| --- | --- |
| Markup | HTML5 |
| Styling | Plain CSS |
| Application logic | Vanilla JavaScript |
| Development storage | `sessionStorage` |
| Production storage | `localStorage` |
| Offline support | Service Worker and Cache Storage |
| Installation metadata | Web App Manifest |
| Icons | `lucide-static` with a generated local SVG sprite |
| Hosting target | GitHub Pages |

## 5. Runtime modes

The active runtime mode is configured in `js/config.js`:

```js
environment: "production"
```

### Development mode

- Uses `sessionStorage`.
- Data survives page refreshes within the same browser session.
- Closing the browser session removes the application data.
- Unregisters Monetra service workers.
- Deletes caches whose names begin with `monetra-`.
- Disables offline PWA behavior during development.

### Production mode

- Uses `localStorage`.
- Data persists between browser and PWA launches.
- Registers `service-worker.js`.
- Precaches the application shell and selected assets.
- Enables offline loading and installable PWA behavior.

Before publishing the production PWA, change the configuration to:

```js
environment: "production"
```

## 6. Default state

The first profile begins with deliberately minimal data:

| Field | Default |
| --- | --- |
| Display name | `User` |
| Caption | `Small steps make a big difference.` |
| Account | `Main Account` |
| Account balance | `$0.00` |
| Account tag | Blue money tag |
| Vehicle name | `My Vehicle` |
| Vehicle type | `SUV` |
| Vehicle colour | `White` |
| Purchase month | Not configured |
| Original price | `$0.00` |
| Loan total | `$0.00` |
| Monthly payment | `$0.00` |
| Value items | Empty |
| Activities | Empty |

The default Vehicle screen does not show vehicle artwork or loan details until valid loan data has been configured.

## 7. Navigation and screen rendering

The bottom navigation contains five sections:

1. Home
2. Value
3. Vehicle
4. Activities
5. Settings

The navigation DOM is created once and remains persistent while switching sections. Only the active screen is replaced. This reduces SVG icon recreation and visual repainting, particularly in iOS standalone mode.

The application uses one delegated document-level click handler for navigation, modal controls, selectors, edit actions, and destructive actions. This allows dynamically rendered elements to work without attaching individual listeners after every render.

## 8. Home

### Total balance

Total Balance is calculated as the sum of every account balance in the active profile.

Account balances cannot be negative. Monetary output always contains two decimal places.

### Balance privacy control

Home balances are hidden by default. Hidden amounts display a fixed placeholder:

```text
$••••••
```

The eye button toggles between the placeholder and the formatted balances. This affects only the Home screen and does not alter stored values.

The privacy toggle updates only:

- The eye icon
- The button accessibility state
- The visible balance text
- The balance accessibility labels

It does not rerender the complete page. The feature provides casual visual privacy, not encryption or protection from browser developer tools.

### Accounts

Users can:

- Add an account
- Edit an account title or balance
- Delete an account after confirmation
- Assign one of ten colour tags

Every account uses the same Lucide money symbol. The selected tag colour differentiates accounts without sharing the icon list used by Value items and Activities.

## 9. Value

The Value section estimates how much a purchase has cost per day of ownership.

Users can:

- Add a Value item
- Select an item icon
- Edit an item
- Open an item detail sheet
- Delete an item after confirmation
- Sort by latest purchase, purchase cost, or best value

### Cost-per-day calculation

Ownership includes the purchase date and never falls below one day:

```text
ownership days = max(1, calendar days since purchase + 1)
cost per day = purchase cost / ownership days
```

Future purchase dates are rejected.

### Sorting

- **Latest:** newest purchase date first
- **Cost:** highest purchase cost first
- **Best Value:** lowest cost per day first

When the list is empty, the existing “No Value items yet” card remains visible with the `subtle-empty` translucent surface.

## 10. Vehicle

The Vehicle section tracks a simple fixed-payment loan. It deliberately separates:

- **Original Price:** informational only
- **Loan Total:** the amount used for all loan calculations

Original Price is never used to calculate the balance, payment count, payoff date, or graph.

### Required loan data

Loan results appear only when all of the following are present and greater than zero where applicable:

- Purchase month and year
- Loan Total
- Monthly Payment

Without complete data, the screen shows a translucent “No Data” state and an Edit Vehicle button. Vehicle artwork and the loan panel remain hidden.

### Loan duration

There is no manually entered loan period. The system derives it as:

```text
loan duration in months = ceil(Loan Total / Monthly Payment)
```

If the Loan Total is not evenly divisible by the Monthly Payment, the final scheduled payment is treated as the remaining balance.

### Payment timing

Payments are counted using the user's local calendar and month boundaries. The day of the month is ignored.

The purchase month begins at payment index zero. Each subsequent fully reached calendar month adds one completed payment. Payment progress cannot exceed the calculated payoff month.

```text
balance at month n = max(0, Loan Total - n × Monthly Payment)
```

At the calculated final month, the balance is explicitly set to zero.

### Loan graph

The SVG graph displays:

- A Y-axis ranging from zero to Loan Total
- An X-axis ranging from the purchase month to the calculated payoff month
- A line representing scheduled loan balance over time
- A progress dot positioned at the current month and current calculated balance
- Start, midpoint, and ending month/year labels
- Compact price labels on the Y-axis

### Vehicle artwork

Vehicle assets are selected from the chosen type and colour using this convention:

```text
assets/vehicles/Vehicle_<Type>_<Colour>.png
```

Supported vehicle types:

- Hatchback
- Sedan
- SUV
- Van
- Coupe
- Motorcycle

Supported colours:

- White
- Black
- Silver
- Red
- Blue
- Grey

`Vehicle_SUV_White.png` is the current placeholder and fallback asset.

### Edit Vehicle sheet

The sheet presents Vehicle Type (SUV, Sedan, Hatchback, Coupe, Van, Motorcycle), Colour, Vehicle Name, Original Price, Loan Total, side-by-side Purchase Year and Purchase Month selectors, then Monthly Payment. Years run from the current year back to 1900, including an older saved year when present. Both date selectors may be blank; otherwise both are required and future months are rejected. The saved purchaseMonth field retains its YYYY-MM format.

Its header, close button, and live vehicle preview form one sticky element. Changing type or colour immediately updates the preview while the form scrolls beneath it.

## 11. Activities

Activities contain:

- Activity name
- Date
- Optional notes
- Selected icon

Activities do not contain a cost.

### Classification

- Dates after today are Upcoming.
- Today's activities are Past from the beginning of the local calendar day.
- Earlier dates are Past.

Upcoming activities are ordered from nearest to furthest. Past activities are ordered newest first.

Each list row displays:

```text
[icon] [activity name] [date] [In X days / X days ago]
```

Selecting an activity opens a detail sheet with Edit and Delete controls. Deletion requires confirmation.

Empty Upcoming and Past lists retain their explanatory cards using the `subtle-empty` translucent surface.

## 12. Profiles and Settings

Each profile owns an independent collection of:

- Profile information
- Accounts
- Value items
- Vehicle data
- Activities

### Profile management

- Display name is the only required field when creating a profile.
- New profiles automatically become active.
- Existing profiles can be switched from Settings.
- Profile deletion is available inside the profile menu.
- Deleting a profile requires confirmation.
- The last remaining profile cannot be deleted.

### About Me

Users can edit:

- Display name
- Caption

### Clear Data

Clear Data requires confirmation and resets only the active profile to the documented default state. Other profiles remain unchanged.

## 13. Validation and destructive actions

The interface validates forms before saving:

- Required names must contain text.
- Account balances cannot be negative.
- Purchase costs cannot be negative.
- Original Price, Loan Total, and Monthly Payment cannot be negative.
- Value purchase dates cannot be in the future.
- Vehicle purchase months cannot be after the current month.
- Activity dates must use a valid ISO date format.

The first invalid field receives focus and displays a nearby error message.

Confirmation is required before:

- Deleting an account
- Deleting a Value item
- Deleting an activity
- Deleting a profile
- Clearing profile data

Successful operations display a temporary toast message.

## 14. Data model

Application state follows this conceptual structure:

```js
{
  schemaVersion: 1,
  currentProfileId: "profile_id",
  profiles: {
    profile_id: {
      id: "profile_id",
      profileInfo: {
        displayName: "User",
        caption: "Small steps make a big difference."
      },
      accounts: [
        {
          id: "account_id",
          title: "Main Account",
          amount: 0,
          icon: "money",
          tagColor: "#2878D0"
        }
      ],
      valueItems: [
        {
          id: "value_id",
          name: "Laptop",
          purchaseCost: 1200,
          purchaseDate: "2026-01-15",
          icon: "laptop"
        }
      ],
      vehicle: {
        name: "My Vehicle",
        originalPrice: 0,
        loanTotal: 0,
        purchaseMonth: "",
        monthlyPayment: 0,
        vehicleType: "SUV",
        vehicleColour: "White"
      },
      activities: [
        {
          id: "activity_id",
          name: "Car servicing",
          date: "2026-11-12",
          notes: "Regular maintenance",
          icon: "wrench"
        }
      ]
    }
  }
}
```

Records receive locally generated unique IDs. Loaded data is accepted only when its schema version is supported and its active profile exists; otherwise Monetra creates a fresh default state.

## 15. Date and number handling

- Stored dates use ISO `YYYY-MM-DD` format.
- Vehicle purchase months use `YYYY-MM` format.
- Display dates use the US order `day short-month year` through `Intl.DateTimeFormat`.
- Calendar calculations use local time with a midday anchor to reduce daylight-saving boundary errors.
- Monetary values use `Number.toLocaleString("en-US")` with exactly two decimal places.
- The application assumes `$` represents the user's everyday currency and does not store a currency code.

## 16. Responsive layout and safe areas

### Mobile-first shell

The application occupies the full mobile viewport. On wider screens, the interface remains inside a centered `430px` maximum-width shell.

Each screen scrolls independently while the bottom navigation remains in a separate persistent grid row.

### iOS standalone PWA handling

The page uses:

- `viewport-fit=cover`
- `apple-mobile-web-app-capable=yes`
- `apple-mobile-web-app-status-bar-style=black-translucent`
- CSS `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`

The background gradient extends behind the status bar and camera area, while screen content is padded below the top safe area.

The bottom navigation includes bottom safe-area padding so its background extends through the home-indicator region.

Installed standalone mode intentionally uses `100vh` as the final shell height. This avoids an iOS WebKit standalone-mode issue where dynamic viewport units can leave visible space below the navigation.

### Modal safe areas

Modal backdrops include top safe-area padding. Modal height is constrained below the sensor housing, and bottom padding accounts for the home indicator. Modal headers remain sticky so close controls stay accessible during scrolling.

### Mobile zoom

The viewport configuration disables user scaling and limits the maximum scale to one, as requested for the mobile application experience.

## 17. Visual design system

The interface uses:

- A modern system-font stack
- A blue and pale-blue gradient background
- Glass-like white cards
- Rounded corners
- Soft blue shadows
- Blue primary actions
- Red destructive actions
- Green positive value indicators

Empty-state cards use the `subtle-empty` class. The card background is currently `rgba(255, 255, 255, 0.20)`, meaning the surface is 80% transparent while text retains full opacity.

## 18. Icons

The full `lucide-static` package is installed locally as the development-time icon source. Monetra does not ship or parse its complete 500 KB sprite at runtime.

Instead, `scripts/generate-icon-sprite.mjs` extracts the 22 icons currently required by the application and creates:

```text
assets/icons/lucide.svg
```

Regenerate the compact sprite after adding or changing icons:

```bash
npm run icons:build
```

The application maps internal semantic names such as `home`, `value`, and `vehicle` to official Lucide symbol IDs. SVG `<use>` references load every displayed icon from the compact local sprite.

## 19. PWA and offline design

`manifest.json` defines:

- Application name and short name
- Standalone display mode
- Start URL and scope
- Theme and background colours
- Install icon

In production, `service-worker.js` precaches:

- The root page and `index.html`
- CSS and JavaScript files
- Configuration
- Manifest
- Application icon
- Compact Lucide sprite
- Wallet artwork
- All 30 vehicle artwork combinations

Requests within the app scope use the current versioned cache first. Uncached requests use the network without modifying the precached release. Offline navigation falls back to `index.html`; other failed requests return a network error. Installation activates only after every shell asset downloads successfully. Cache cleanup removes only older `monetra-shell-` caches. User data in localStorage is not affected.

During installation, the service worker calls `skipWaiting()` after precaching. During activation, it removes older Monetra cache versions and calls `clients.claim()` so the updated worker controls open pages promptly.

The current cache identifier is:

```text
monetra-shell-v16
```

Increment this identifier whenever a production asset update must invalidate the previous shell cache.

## 20. Accessibility and interaction details

- Navigation identifies the active page with `aria-current`.
- The privacy control uses `aria-label` and `aria-pressed`.
- Hidden balances expose “Balance hidden” rather than the actual amount to assistive technology.
- Decorative images are hidden from assistive technology.
- Icon-only colour and close buttons include accessible labels.
- Vehicle graphs include an accessible summary.
- Modal containers use dialog semantics.
- Escape closes an open modal on keyboard-capable devices.
- Reduced-motion preferences disable application animation.
- User-provided text is escaped before insertion into generated HTML.

## 21. Optional WebMCP integration

When the browser exposes `document.modelContext`, Monetra registers tools that can add accounts and activities programmatically. The feature is capability-detected and does nothing in browsers without WebMCP support.

This integration remains local to the active profile and uses the same storage and rendering paths as interface actions.

## 22. Project structure

```text
Monetra/
├── index.html
├── manifest.json
├── service-worker.js
├── package.json
├── package-lock.json
├── README.md
├── PROJECT_DOCUMENTATION.md
├── css/
│   └── styles.css
├── js/
│   ├── config.js
│   └── app.js
├── scripts/
│   └── generate-icon-sprite.mjs
├── assets/
│   ├── wallet-balance.png
│   ├── icons/
│   │   ├── app-icon.svg
│   │   └── lucide.svg
│   └── vehicles/
│       └── Vehicle_SUV_White.png
└── node_modules/
    └── lucide-static/
```

`node_modules` supplies development assets and should not be required by the deployed application. Runtime assets needed by GitHub Pages are stored under `assets`.

## 23. Local development

Install the icon dependency:

```bash
npm install
```

Regenerate the application icon sprite when necessary:

```bash
npm run icons:build
```

Serve the `Monetra` directory through a local HTTP server. Opening `index.html` directly with a `file://` URL is not representative of production browser and service-worker behavior.

Keep `environment: "development"` while testing to use session-only data and avoid service-worker cache interference.

## 24. Production deployment

1. Change `environment` in `js/config.js` to `"production"`.
2. Regenerate the Lucide subset if the icon list changed.
3. Increment the service-worker cache name if cached production assets changed.
4. Confirm every required vehicle asset follows the naming convention.
5. Publish the contents of `Monetra` as the GitHub Pages site root.
6. Load the deployed site once online so the service worker can install and precache the application shell.

No application build or backend deployment is required.

## 25. Known limitations

- Browser storage can be cleared by the user or operating system and is not a backup system.
- Data does not synchronize between devices or browser profiles.
- Home balance hiding is visual privacy, not encryption.
- Vehicle calculations model a zero-interest fixed-payment balance and do not support interest, fees, changing payment amounts, or payment-day precision.
- Only the default vehicle artwork is currently guaranteed to exist; missing combinations fall back to the white SUV placeholder.
- The official app icon is supplied as a 512px PNG for installation and Apple touch icons, plus an SVG containing the original PNG for faithful favicon rendering. The SVG preserves the raster artwork; it is not a vector-path tracing.
- JavaScript-rendered screens depend on JavaScript being enabled.
