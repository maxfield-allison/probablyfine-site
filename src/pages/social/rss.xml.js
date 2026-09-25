import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { publishedSocial } from '../../lib/social';
export async function GET(context) {
  const posts = (await getCollection('social', publishedSocial)).sort((a,b) => b.data.date.getTime()-a.data.date.getTime());
  return rss({title:'ProbablyFine · Social',description:'Short posts and screenshots.',site:context.site,trailingSlash:false,
    items:posts.map(post=>({title:post.data.title,description:post.data.caption,pubDate:post.data.date,link:`/social/${post.id}`,categories:post.data.tags}))});
}
