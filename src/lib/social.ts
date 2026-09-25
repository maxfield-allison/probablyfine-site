import type { CollectionEntry } from 'astro:content';

export const publishedSocial = ({ data }: CollectionEntry<'social'>) =>
  !data.draft && data.date.getTime() <= Date.now();

export const socialDate = (date: Date) => date.toLocaleDateString('en-US', {
  timeZone: 'America/Chicago', month: 'long', day: 'numeric', year: 'numeric',
});
