# Integration pages

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

## Adding another integration

1. Add an application page under `src/pages/integrations/` using `IntegrationLayout.astro`. Identify its operator, audience, purpose, current availability, support contact, and connected services.
2. Describe the actual requested permissions and data fields, where copies go, who can access them, and how to disconnect. Distinguish an application selection from the permission granted by the provider.
3. Review the shared privacy and terms pages against the implementation. Update them or supply an application-specific policy if the new application behaves differently. Do not reuse the links as placeholders for undisclosed data use.
4. Link the application from the directory, and link both policies from its homepage. Update dates and retain history in git when disclosures change. Obtain new consent before new access or uses begin.
5. Run `pnpm build`, check the new routes and links at desktop and mobile sizes, and review the public copy before merge. Verify the deployed pages before changing provider console URLs.

Google reference: [Branding requirements](https://support.google.com/cloud/answer/15549049) and [API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy). These pages describe the application; they are not a guarantee of provider approval.
