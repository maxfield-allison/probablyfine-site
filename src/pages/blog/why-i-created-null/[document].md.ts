import type { APIRoute } from 'astro';
import { getEntry } from 'astro:content';
import { listed } from '../../../lib/posts';
import { documents, nullSlug } from '../../../lib/null-article';

export async function getStaticPaths() {
  const post = await getEntry('posts', nullSlug);
  if (!post || !listed(post)) return [];
  return documents.map((doc) => ({ params: { document: doc.file }, props: { text: doc.text } }));
}

export const GET: APIRoute = ({ props }) => new Response(props.text, {
  headers: { 'Content-Type': 'text/markdown; charset=utf-8', 'X-Robots-Tag': 'noindex' },
});
