// Giscus comments configuration (GitHub Discussions-backed).
//
// Comments render on blog posts ONLY when both repoId and categoryId are set.
// Until then the <Comments /> component renders nothing, so the build is safe
// to ship before setup is complete.
//
// To enable (one-time):
//   1. On GitHub, enable Discussions for maxfield-allison/probablyfine-site
//      (repo Settings → General → Features → Discussions).
//   2. Install the giscus app: https://github.com/apps/giscus (grant it access
//      to the probablyfine-site repo).
//   3. Go to https://giscus.app, enter the repo, pick mapping "pathname" and a
//      Discussion category (e.g. "Announcements" or a dedicated "Comments"
//      category with "Announcements"-style write access). It prints a
//      data-repo-id and data-category-id.
//   4. Paste those two values below and redeploy.

export const giscus = {
  repo: 'maxfield-allison/probablyfine-site' as const,
  repoId: '', // e.g. 'R_kgD...'  ← fill in from giscus.app
  category: 'Comments',
  categoryId: '', // e.g. 'DIC_kwD...'  ← fill in from giscus.app
  // Visuals / behavior
  mapping: 'pathname' as const,
  theme: 'dark' as const,
  reactionsEnabled: '1' as const,
  inputPosition: 'bottom' as const,
};

export const giscusEnabled = giscus.repoId !== '' && giscus.categoryId !== '';
