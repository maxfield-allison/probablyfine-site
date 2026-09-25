import { getCollection } from 'astro:content';
import { publishedSocial } from '../../lib/social';

// Public syndication contract v1. No private queue, calendar or account records.
export async function GET() {
  const posts = (await getCollection('social', publishedSocial)).sort((a,b) => b.data.date.getTime()-a.data.date.getTime());
  return Response.json({ version: 1, posts: posts.map(({id,data}) => ({
    id, title:data.title, date:data.date.toISOString(), caption:data.caption,
    canonical_url:`https://probablyfine.dev/social/${id}`, tags:data.tags,
    assets:data.image ? [{url:new URL(data.image.src,'https://probablyfine.dev').href,alt_text:data.image.alt,width:data.image.width,height:data.image.height}] : [],
    process_note:data.processNote,
  })) });
}
