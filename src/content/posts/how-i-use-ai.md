---
title: "How I use AI"
date: 2026-08-18
tags: ["ai", "writing", "meta"]
aiRole: drafted
draft: false
description: "A bot on reddit held my post until I said whether AI was involved. The full answer wouldn't have fit in the box it wanted so here's the long version: what the tag on this blog means now, where the lines are, and \"Did you just use AI to make this?\" is the wrong thing to be asking."
---

A bot on reddit pulled my post down about ten seconds after I submitted it.

I posted to r/selfhosted about building a timeline of my homelab experience out of old purchase records. The subreddit runs an automated audit bot, u/asimovs-auditor, that removes every submission on sight and holds it until the author leaves a comment about how AI was used in the post. So I left one. The whole comment was "Ai wasn't used to make this post." The bot put the post back, and it went on to do about 12,000 views.

The sentence was true, but it was worth almost nothing. The bot hadn't even asked me for a yes or a no. It asked how AI was used, and I typed five words into an open box, which is about as much thought as I had given the question at that point. It's the same low effort I'd have called out in somebody else's post, and it bought exactly what low effort buys. That small interaction sparked the thought processes that brought about this page.

## The check doesn't actually check anything

The auditor accepts any string. It isn't analyzing the answer, it just confirms a person bothered to type something. Somebody who wants to get through dishonestly types "AI wasn't used to make this project/blog post/cool thing" and moves on. Somebody who spent three weeks on a thing a model helped with has to distill that experience and effort into something that will almost certainly get brigaded. There's no test on the receiving end that tells those two apart, and there isn't going to be one, because anyone willing to put in enough effort is undetectable by construction.

There's a second problem underneath that one. Most of the time people can just tell. The texture gives it away and readers can feel it way before they reach any disclosure. And when somebody has covered it well enough that the texture doesn't give it away, the gate doesn't catch them either. So the check is either confirming something the reader had already worked out, or missing the exact case it exists to catch.

So as verification, it's theater. Useful theater, potentially, since it could make someone stop for a second. But any disclosure worth reading has to be voluntary and specific, and it's worth exactly as much as the track record behind it.

The brigading from folks that are decidedly "anti-AI" definitely puts a hand on the scale in favor of keeping quiet about AI use, and I completely get that. Saying nothing costs nothing. Describing something specific gives people ammunition to argue with, and plenty will, especially on a site like reddit. Some of that will be fair, and I want the fair kind. Some will come from people for whom any AI use is disqualifying no matter what surrounds it, and nothing I write here will move them. After thinking about this topic for a relatively long time, I decided I'd rather hand them the bullets anyway. A gate that can't verify anything provides you with a track record and basically nothing else. A track record only gets established one disclosure at a time.

Here's mine.

## What I think actually matters

The substance and the process are the important things. Tools matter to the extent that they served what the person was trying to make.

An artist can throw a gallon of one color at a canvas, or spend a month building an image out of that same single color, brush stroke by brush stroke. A writer can publish pulp or agonize over every word choice. Someone can tell a model "I want an app that does my taxes," or they can research the domain, develop standards, pull together a body of prior art, run adversarial reviews, and use agents the way a director uses a studio team. You can give no effort at all, or you can be your own harshest critic.

It's this spectrum I care about, not the human-versus-machine one. The same tool sits at both ends of it.

The Profilarr maintainer put together a version of this some time ago that came across some feed of mine, in a page on [AI transparency](https://v2.dictionarry.dev/ai-transparency) that's worth your time. His framing is that "was AI involved" displaces the questions people care about, which are whether the person understands what they built, whether the reasoning is visible, and who is accountable for the product.

## Signing is not typing

The Linux kernel merged a policy on AI coding assistants this year, and the useful part of it isn't the disclosure rule. It's this:

AI agents must not add a `Signed-off-by` tag, because only a human can certify the Developer Certificate of Origin. The kernel didn't restrict who writes the code. It restricted who can sign it. Who can be responsible for it.

A few lines further down the same document: "Basic development tools (git, gcc, make, editors) should not be listed."

That settles something I'd been stuck on. I talk to a model constantly while I work. It checks my dates against my own archives, it argues with me about structure, and it tells me when a claim in a draft doesn't survive contact with the evidence. If all of that made it the author, then nobody who runs a spellchecker has written anything. So I'm not going to tell you a post is "not AI-assisted," because the phrase is close to unclaimable now and it measures the wrong thing regardless.

What I'll tell you instead is who did the work. I don't sign anything I wouldn't have come up with and stated myself.

One difference I should be honest about: when a kernel contributor signs off, there's a maintainer, a review, and a revert waiting behind the signature. When I sign something here, there's nothing behind it but this page and the embarrassment of getting caught breaking it. That's thin. It's also all any personal policy has ever amounted to.

## What the tag on this blog means

Every post here carries a tag describing how it was created. Until now that tag was a yes or no, which made it useless, because it said yes on everything. It now says one of three things, and it's applied to everything I've already published as well as everything new.

**Written by hand.** I wrote the outline and every sentence. A model answered questions and checked facts, and wrote none of it.

**Research assist.** Same as above, plus a model gathered or verified source material that shaped what I wrote.

**AI-drafted, edited by me.** Drafted to an outline I argued over first, against a large body of my own prior writing, then edited line by line until it said what I meant.

Still, three labels for something that doesn't really reduce to three labels, so from here on each post also carries a short note that details more about how that particular piece was crafted. The labels are for a quick scan and the notes are the full disclosure. This one has its note at the bottom.

This page is in the third category, and I think that's the right way to publish it.

Full disclosure on the tag itself: as of today, every post on this blog is in that third category, so the new labels don't distinguish anything yet either. They start working when the first hand-written piece lands, and one is planned. The difference between this and the old boolean is that the old one could never say anything else, and this one is about to.

The current version of these rules lives at [/ai](/ai), with a changelog. This post is where they came from. That page is what's true now.

## Where the lines are

**Writing.** Covered by the tag and the note. The standard doesn't change between categories, only the method does.

**Engineering.** I use AI heavily. I direct it, I review what comes back, I reject a lot of it, and I'm responsible for all of it. I red-team what I ship, especially the parts a model wrote, because those are the parts most likely to look right and be wrong. When something breaks anyway, it's mine, and "the model wrote that part" isn't a defense I get to use.

**Art, music, and voice.** No generated assets in anything I ship. Narrative prose is held to the same standard as the rest of my writing. Given the option on anything, I'll use human-created, every time.

For scope: this covers the writing I publish under my own name, here and on the social surfaces that carry it. Project documentation doesn't get this treatment, because most of it is generated from the code and reviewed the way code is. And the standard disclaimer, none of this covers my day job, which isn't mine to write about here.

## Don't take my word for the label

A tag I assign myself is a self-report, and self-reports are exactly the kind of claim a skeptic should discount. The Linux kernel is currently arguing about deleting the attribution tag it just added, on the grounds that the signal is low and people don't all use it in good faith. Both of those objections apply to me too. I'm one person, so the population problem is smaller, but "trust me" is still what a label amounts to.

Most of the apparatus behind this is private and you can't inspect it, so I'd rather say that than imply otherwise. But as my dad says, "The proof is in the pudding." Here's the pudding:

- The em dashes. I don't use them. Across roughly 650,000 words of my own writing going back to 2013, reading every instance in context, there's exactly one I can't rule out, and even that one is ambiguous. The rest are inside quotes or inside text I've already identified as machine-written. That figure includes about 12,700 words of private notes with no audience at all, some of it written during bad weeks and never meant to be read by anyone. So it isn't me editing carefully in public, it's a motor habit. Go look at anything I've published. If you find one that isn't in a quote, either I didn't post it or I did on purpose at the dawn of accessible AI tools (more on that in the last bullet below...). One limit worth stating plainly: this receipt only authenticates what I write unaided. On the drafted posts the model is explicitly told to write without em dashes, so the fingerprint there is manufactured, not evidence. That's part of why the tags exist at all. On assisted work the texture can't tell you anything, so a label and a track record are what's left.

- The code. My contributions to OPNsense are public and dated, and I made them in PHP, which I didn't know then and still don't. The shapes are recognizable enough that the second one was easy. There's a fix of mine merged into a Plex database repair tool too, which is shell, and I worked that one out on my own broken database through research and testing before I sent it anywhere. That's the part of "I could do this without AI, it would just take longer" that doesn't require you to believe me.

- The corrections. The history I write from is a sourced document with a provenance tag on every entry, and the entries I got wrong are still in it with the retractions attached, because I've never had a correction run in the flattering direction and I'd rather leave the evidence of that visible.

- And the failures. There are AI-written posts in my own Facebook history from 2023 through 2025. I ran them partly to see what the tech could do and partly because it was easy, and calling them "experiments" now would be generous to past me, so I won't. They're mine, they're still up, and one of them is a comment where I typed "try gpt." and pasted the answer underneath. They're mechanically obvious now: eleven times longer than my own posts, thirteen times the em dashes, and not a single "lol" among them.

## On slop

Linus Torvalds said recently there's zero point in talking about AI slop and that the kernel documentation should treat AI as a tool and nothing more. He's right about kernel patches, where tests and review settle what's true and it genuinely doesn't matter who typed it.

He wasn't talking about prose, and I won't pretend he was. But that line travels, and it gets borrowed for everything now, so it's worth saying where it stops. Prose, generally, has no test suite, so whether a person meant it is the question. And meaning it isn't enough on its own. Someone can sincerely mean a model's raw output, publish it untouched, and it can still be slop.

The things that separate craftsmanship from slop are all questions about process. Was the output trained on anything? Was it edited after generation? Did the user push back? More than once? Repeatedly? Did they throw the whole thing out and start over?

And on the other hand, is the creator using manipulative tactics in their prompts to output engagement bait?

Or, are they trying to build something that would otherwise cost more time than this economy gives them, which is a different situation entirely and deserves to be treated as one. That last one excuses reaching for the tool. It doesn't excuse publishing something you never read.

Generative AI has no monopoly on low effort. It's just the fastest way anyone has ever had to produce a lot of it.

## The last thing

Working this way isn't slower or faster. It's more thorough than I could otherwise afford to be. I'm not putting less into what I make, I have a better economy for where my effort goes. I choose to put it into the things that matter and the parts I'm most interested in. The tools didn't make anyone lazy. They accentuate what was already there, in both directions.

Which is what I keep mulling over. It's bigger than AI. Something has been consuming our capacity to care about any one thing for any meaningful amount of time, for quite awhile now. This technology didn't trigger it but it did make the results easy enough to see all at once.

That's a different piece, and I'd rather write it by hand.

---

**How this one was made.** The argument is mine and I'd been chewing on it for about a week before any of it got written down. The draft was written to an outline I argued over first, against a large body of my own prior writing, and then I went through it line by line.

I sent it back more times than I planned to. The passage where I implicate my own five word answer is there because I asked for it, and so is the paragraph about doing this anyway despite what it costs. The opening is my rewrite. The first version said the bot asks whether AI was involved. It actually asks how it was used, which changes the point of the whole section, because the question the bot asks is fine and the verification is what's missing.

Two claims got walked back during fact-checking, both in my favour before the check and not after it. I'd written that there are no em dashes anywhere in my writing; the accurate version is that there's one I can't rule out and it's ambiguous. And I'd credited two open source contributions as being in languages I didn't know. That's true of the OPNsense work, which is PHP. The other one is shell, which I do know, so the honest claim there is that I worked the fix out myself rather than that I learned a language to do it.

Before it went up I ran it through two more reviews, one as a policy audit and one with the reviewer told to attack it. A review by the same model that drafted the thing has obvious limits, and it still turned up sixteen problems, including that my replacement tag currently says the same thing on every post that the old one did. The fixes are in the text above, and the rules now live at [/ai](/ai) with a changelog, so the next problem found gets fixed in the open instead of in an edit nobody sees.

Tagged ai-drafted, edited by me. That's the honest label for it.
