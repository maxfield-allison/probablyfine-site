# Integration pages

These pages are unlisted: no main navigation or footer links, no sitemap entries, and a `noindex` meta tag supplied by the integration layout. Crawling remains allowed so search engines can read that tag. Direct links are public; this is not access control.

These static pages describe private account connections without exposing account data or requiring a login to read the policies. The application name on its homepage should match the name on the provider consent screen.

## Calendar OAuth branding URLs

Use these only after the corresponding pages have deployed and load publicly:

| Field | URL |
| --- | --- |
| Application homepage | https://probablyfine.dev/integrations/haliphron-calendar-sync |
| Privacy policy | https://probablyfine.dev/integrations/privacy |
| Terms of service | https://probablyfine.dev/integrations/terms |
| Authorized domain | probablyfine.dev |

Publishing pages does not verify a Google application, change its OAuth permissions, or activate synchronization.

## Backup OAuth branding

| Field | Value |
| --- | --- |
| Application name | Haliphron Backups |
| Application homepage | https://probablyfine.dev/integrations/haliphron-backups |
| Privacy policy | https://probablyfine.dev/integrations/privacy |
| Terms of service | https://probablyfine.dev/integrations/terms |
| Authorized domain | probablyfine.dev |
| Support / developer contact | maxfield.allison@gmail.com |
| OAuth client type | Desktop app |
| Requested data scope | https://www.googleapis.com/auth/drive.file |

Verify the deployed application and both policies before supplying these URLs for backup branding.
The homepage URL is disclosure, not an OAuth redirect; Desktop authorization uses a local
loopback callback. No public callback route or web client secret belongs in these static pages.

The new backup project is intentionally separate from calendar sync and agent read access.
Keep public application names independent of client model, hostname, and pilot/production status.
The broader project and API preparation is recorded under brain#137. Publishing these pages does not rename or migrate a Google project, OAuth client or ContextForge lane.

## Read and action application branding

| Application | Homepage | Current purpose |
| --- | --- | --- |
| Haliphron Google Read | https://probablyfine.dev/integrations/haliphron-google-read | Operating private read service; migration from the calendar-named project is pending. |
| Haliphron Google Actions | https://probablyfine.dev/integrations/haliphron-google-actions | Planned workflows only; no action service is commissioned. |

Both use the shared privacy/terms URLs, authorized domain and operator contact listed above. The read page enumerates actual scopes and explains model-provider processing. The action page does not request speculative broad consent; update it with exact supported workflows and scopes before commissioning any writer. Mail, calendar and document actions can share a consent application while retaining separate clients and credentials; user revocation is shared across the project.

Calendar status was checked on September 10: its systemd timer is active and its sanitized health receipt reports a successful run. The calendar page now reflects scheduled operation while retaining the invitation/RSVP qualification limit.

The current Google sign-in and Home Assistant project census does not establish a new public application under these names. Add their operator pages when actual branding, audience and configured flows are confirmed, rather than describing an unused Google source as active.

## Adding another integration

1. Add an application page under `src/pages/integrations/` using `IntegrationLayout.astro`. Identify its operator, audience, purpose, current availability, support contact, and connected services.
2. Describe the actual requested permissions and data fields, where copies go, who can access them, and how to disconnect. Distinguish an application selection from the permission granted by the provider.
3. Review the shared privacy and terms pages against the implementation. Update them or supply an application-specific policy if the new application behaves differently. Do not reuse the links as placeholders for undisclosed data use.
4. Link the application from the directory, and link both policies from its homepage. Update dates and retain history in git when disclosures change. Obtain new consent before new access or uses begin.
5. Run `pnpm build`, check the new routes and links at desktop and mobile sizes, and review the public copy before merge. Verify the deployed pages before changing provider console URLs.

Google reference: [Branding requirements](https://support.google.com/cloud/answer/15549049) and [API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy). These pages describe the application; they are not a guarantee of provider approval.
