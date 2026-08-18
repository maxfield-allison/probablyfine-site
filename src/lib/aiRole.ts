// How much a model was involved in a given post.
//
// This replaced a boolean that was true on every post, which meant it carried no
// information at all. The values describe process, because that is the thing worth
// disclosing. Each post also carries a short note saying what actually happened to it;
// these labels are for scanning, the notes are the real disclosure.
export const AI_ROLES = ['none', 'research', 'drafted'] as const;

export type AiRole = (typeof AI_ROLES)[number];

const LABELS: Record<AiRole, string> = {
  none: 'written by hand',
  research: 'research assist',
  drafted: 'ai-drafted, edited by me',
};

// Hand-written posts get the accent colour because the absence of a machine is the
// notable thing; the assisted tiers keep the warn colour the old tag used.
const COLORS: Record<AiRole, string> = {
  none: 'var(--color-accent)',
  research: 'var(--color-warn)',
  drafted: 'var(--color-warn)',
};

export const aiRoleLabel = (role: AiRole) => LABELS[role];
export const aiRoleColor = (role: AiRole) => COLORS[role];
