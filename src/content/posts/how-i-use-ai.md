---
title: "How I use AI"
date: 2026-08-18
tags: ["ai", "writing", "meta"]
aiRole: drafted
draft: true
description: "A bot on reddit held my post until I said whether AI was involved. The honest answer didn't fit in the box it wanted. So here's the long version: what the tag on this blog means now, where the lines are, and why whether a machine touched the text is the wrong thing to be asking."
---

A bot on reddit pulled my post down about ten seconds after I submitted it.

I posted to r/selfhosted about building a timeline of my homelab out of old purchase records. The subreddit runs an automated audit bot that removes every submission on sight and holds it until the author leaves a comment about how AI was used in the post. So I left one. The whole comment was "Ai wasn't used to make this post." The bot put the post back, and it went on to do about 12,000 views.

The sentence was true, but it was worth almost nothing. That small interaction sparked the thought processes that brought about this page.

## The check doesn't actually check anything

The auditor accepts any string. It isn't analyzing the answer, it just confirms a person bothered to type something. Somebody who wants to get through dishonestly types "AI wasn't used to make this project/blog post/cool thing" and moves on. Somebody who spent three weeks on a piece a model helped with has to distill that experience and effort into something that will almost certainly get brigaded. There's no test on the receiving end that tells those two apart, and there isn't going to be one, because anyone willing to put in enough effort is undetectable by construction.

So as verification, it's theater. Useful theater, possibly, in that it makes people stop for a second. But any disclosure worth reading has to be voluntary and specific, and it's worth exactly as much as the track record behind it.

Here's mine.

## The part I think actually matters

The substance and the process are the important thing. Tools matter to the extent that they served what the person was trying to make.

An artist can throw a gallon of one color at a canvas, or spend a month building an image out of that same single color, brush stroke by brush stroke. A writer can publish pulp or agonize over every word choice. Someone can tell a model "I want an app that does my taxes," or they can research the domain, develop standards, pull together a body of prior art, run adversarial reviews, and use agents the way a director uses a studio team. You can give no effort at all, or you can be your own harshest critic.

That's the axis I care about, and it isn't the human-versus-machine one. The same tool sits at both ends of it.

The Profilarr maintainer got to a version of this before I did and put it better than my first few attempts, in a page on [AI transparency](https://v2.dictionarry.dev/ai-transparency) that's worth your time. His framing is that "was AI involved" displaces the questions people care about, which are whether the person understands what they built, whether the reasoning is visible, and whether anyone is accountable when it breaks.

## Signing is not typing

The Linux kernel merged a policy on AI coding assistants this year, and the useful part of it isn't the disclosure rule. It's this: AI agents must not add a `Signed-off-by` tag, because only a human can certify the Developer Certificate of Origin. The kernel didn't restrict who writes the code. It restricted who can sign it.

A few lines further down the same document: "Basic development tools (git, gcc, make, editors) should not be listed."

That settles something I'd been stuck on. I talk to a model constantly while I work. It checks my dates against my own archives, it argues with me about structure, and it tells me when a claim in a draft doesn't survive contact with the evidence. If all of that made it the author, then nobody who runs a spellchecker has written anything. So I'm not going to tell you a post is "not AI-assisted," because the phrase is close to unclaimable now and it measures the wrong thing regardless.

What I'll tell you instead is who did the work. I don't sign anything I wouldn't have come up with and stated myself.

## What the tag on this blog means

Every post here carries a tag describing what happened to it. Until now that tag was a yes or no, which made it useless, because it said yes on everything. It now says one of three things, and it's applied to everything I've already published as well as everything new.

**Written by hand.** I wrote the outline and every sentence. A model answered questions and checked facts, and wrote none of it.

**Research assist.** Same as above, plus a model gathered or verified source material that shaped what I wrote.

**AI-drafted, edited by me.** Drafted to an outline I argued over first, against a large body of my own prior writing, then edited line by line until it said what I meant.

That's still three labels for something that doesn't reduce to three labels, so from here on each post also carries a short note saying what happened to that particular piece. The labels are for scanning. The notes are the real disclosure. This one has its note at the bottom.

This page is in the third category, and I think that's the right way to publish it.

## Where the lines are

**Writing.** Covered by the tag and the note. The standard doesn't change between categories, only the method does.

**Engineering.** I use AI heavily. I direct it, I review what comes back, I reject a lot of it, and I'm responsible for all of it. When something I ship breaks, "the model wrote that part" isn't a defense I get to use, and I wouldn't want it.

**Art, music, and voice.** No generated assets, in anything I ship. Narrative prose is held to the same standard as the rest of my writing. Given the option on anything else, I'll use human-made.

None of this covers my day job, which isn't mine to write about here.

## Don't take my word for the label

A tag I assign myself is a self-report, and self-reports are exactly the kind of claim a skeptic should discount. The Linux kernel is currently arguing about deleting the attribution tag it just added, on the grounds that the signal is low and people don't all use it in good faith. Both of those objections apply to me too. I'm one person, so the population problem is smaller, but "trust me" is still what a label amounts to.

Most of the apparatus behind this is private and you can't inspect it, so I'd rather say that than imply otherwise. What you can check:

The em dashes. I don't use them. Across roughly 650,000 words of my own writing going back to 2013, reading every instance in context, there's exactly one I can't rule out, and even that one is ambiguous. The rest are inside quotes or inside text I've already identified as machine-written. That figure includes about 12,700 words of private notes with no audience at all, some of it written during bad weeks and never meant to be read by anyone. So it isn't me editing carefully in public, it's a motor habit. Go look at anything I've published. If you find one that isn't in a quote, something is wrong.

The code. My contributions to OPNsense are public and dated, and I made them in a codebase and a language I didn't know when I started. There's a fix of mine merged into a Plex database repair tool too. That's the part of "I could do this without AI, it would just take longer" that doesn't require you to believe me.

The corrections. The history I write from is a sourced document with a provenance tag on every entry, and the entries I got wrong are still in it with the retractions attached, because I've never had a correction run in the flattering direction and I'd rather leave the evidence of that visible.

And the failures. There are AI-written posts in my own Facebook history from 2023 through 2025. I ran them deliberately, as experiments with what the tech could do at the time, and one of them is a comment where I typed "try gpt." and pasted the answer underneath. They're mechanically obvious now: eleven times longer than my own posts, thirteen times the em dashes, and not a single "lol" among them.

## On slop

Linus Torvalds said recently there's zero point in talking about AI slop and that the kernel documentation should treat AI as a tool and nothing more. He's right about kernel patches, where tests and review settle what's true and it genuinely doesn't matter who typed it.

I don't think it transfers. Prose has no test suite, so whether a person meant it is the question. And meaning it isn't enough on its own. Someone can sincerely mean a model's raw output, publish it untouched, and it's still slop.

The things that separate work from slop are all questions about process. Did they train it on anything. Did they edit after. Did they push back, more than once. Did they throw the whole thing out and start over. Are they being manipulative with it. Or are they trying to build something that would otherwise cost more time than this economy gives them, which is a different situation entirely and deserves to be treated as one.

Generative AI has no monopoly on low effort. It's just the fastest way anyone has ever had to produce a lot of it.

## The last thing

Working this way isn't slower. It's more thorough than I could otherwise afford to be. I'm not putting less into what I make, I have a better economy for where the effort goes, and it goes into the parts that matter and the parts I'm most interested in. The tools didn't make me lazy. They accentuate what was already there, in either direction.

Which is the part I keep circling, and it's bigger than AI. Something has been eating our capacity to care about any one thing for a long time now, and this technology didn't start it. It just made the results cheap enough to see all at once.

That's a different piece, and I'd rather write it by hand.

---

**How this one was made.** The argument is mine and I'd been chewing on it for about a week before any of it got written down. The draft was written to an outline I argued over first, against a large body of my own prior writing, and then I went through it line by line.

The opening is my rewrite. The first version said the bot asks whether AI was involved. It actually asks how it was used, which changes the point of the whole section, because the question the bot asks is fine and the verification is what's missing.

Two claims got walked back during fact-checking, both in my favour before the check and not after it. I'd written that there are no em dashes anywhere in my writing; the accurate version is that there's one I can't rule out and it's ambiguous. And I'd credited two open source contributions as being in languages I didn't know, which is true of the OPNsense work and not established for the other one.

Tagged ai-drafted, edited by me. That's the honest label for it.
