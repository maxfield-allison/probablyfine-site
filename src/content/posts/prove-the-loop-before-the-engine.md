---
title: "Prove the loop before the engine"
description: "I'm building a game, and the honest first deliverable isn't gameplay code. It's a single HTML file that exists to answer one question: is the core loop worth building at all? The methodology, the playable prototype, and the telemetry design behind it."
date: 2026-08-13
tags: ["zeroday", "gamedev", "prototyping", "playtest"]
aiAssisted: true
draft: true
---

When my pipeline goes green at work, I mostly trust it. Tests passed, the image built, the config validated. Green means healthy, and when it lies, it at least lies in ways I know how to debug.

I've spent this year learning that games get no such signal. I'm building one, and every quality gate I trust professionally answers the wrong question. Tests can prove the trace meter increments correctly. Types can prove the card can't target a node that doesn't exist. Nothing in a pipeline can prove that a turn feels good, that a stranger takes a second run, that the tension you designed actually lands on a person who didn't design it. Green CI means "it runs." It has never once meant "it works."

That gap is what this post is about. The game comes along for the ride.

## Why a single HTML file

The usual failure mode for a solo game project is months of engine work in service of a loop nobody has ever played. You build the systems, the systems demand content, the content demands tools, and the question "is this fun" stays unanswered underneath the whole stack because answering it now would be embarrassing.

So I inverted it. Before any engine code, the game had to exist as one HTML file. No build step, no assets, no art beyond colored shapes, no engine. A board, cards, numbers, and the loop. If the game is interesting under those constraints, the interest is coming from the loop itself, because there is nothing else there to supply it. And if it's boring, I've lost a few evenings instead of a year, and the file is cheap enough to throw away without grief.

The prototype is not the game and never will be. It's a testbed with one job: answer a design question before that question gets expensive.

## What the game is

ZERO/DAY, working title, is a hacker roguelike deckbuilder. You're a hacker working contracts. Each job is a network you have to get into, cross, take something from, and leave. The board is a node graph. You spend cycles to move between hosts, you play cards to deal with what's in the way, and a trace meter climbs the whole time you're inside.

The design rule everything is built on is that every visual element and every piece of fiction has to be explainable as a rendering of something a real tool could know or do. I've been calling it the CLI test. If I can't explain a mechanic in network terms, it doesn't end up in the game.

The in-fiction justification is that the board is the hacker's own dashboard. It's their bash aliases made visual. Fog of war isn't a spell, it's the fact that you haven't scanned that host yet. The system log tells you what's happening in the network, but it obeys the fog too; events you had no way to observe arrive muffled and inference-shaped, never as clean narration of something you shouldn't know. This rule kills a lot of potentially cool ideas. It's also the reason the project stayed interesting past week two, because the way networks behave is the part I know something about. I run a fairly complex one in my house, and my day job is basically the same thing.

The other half of the same rule is, keep the story opaque, but ensure systems and mechanics are transparent. You're allowed to wonder what you're actually stealing and for whom. You are never allowed to be confused about what a card does.

## The two clocks

The concrete mechanic that makes the loop worth testing is that there are two clocks, and they run at different speeds. I've taken to calling them clocks because unlike in games that try to create time pressure with a countdown, I'm using something the player has a say in. These things can run backwards.

The first is session trace. While you're inside a network, noise accumulates: every loud move, every fight, every sloppy exit pushes it up. Hit the ceiling and that run ends badly. Trace resets when the job ends. It's the classic push-your-luck timer, and on its own it would make a fine but forgettable game.

The second is Heat, and it doesn't reset. Heat is career-level consequence. How loudly you've been operating across jobs, whether you kill things you could sneak past, whether you leave logs or scrub them all build it up. It follows you between contracts and changes what the world offers you. The interesting decisions are between the clocks. Scrubbing logs to cool your Heat costs cycles right now, this turn, when you're two nodes from the exit and the trace is at 80. The payoff arrives three contracts later, because Heat sets how much room you get before the trace maxes: a cold operator walks into the next job with the full meter to spend, and a hot one starts already half-burned, with the corps actively watching for them. Every deckbuilder teaches you to survive the run you're in. This one also asks what kind of operator you're becoming.

<!-- SECTION 5: EMBED — placeholder, completed after v9 final push + site integration
     iframe /play/v9/ + fullscreen link + one paragraph of framing + the ask:
     play a run, send the data. Notes: real screen recommended, fixer intro, entry vectors.
-->

## Instrumenting a game like a service

Here's the part where the day job leaks in. If the prototype is a standing playtest instead of a one-off session, it needs telemetry, and telemetry for a game you host for strangers is a different animal from telemetry for a few people in a room who agreed in person.

The consent model came first, and it has three independent switches, all defaulting to off: play data (the automatic event stream), feedback answers (the survey, which is where free text lives), and contact (an email, only if you want a reply). They're separate on purpose. Free text is where personal information accidentally lands, so it gets its own gate and its own payload, and the telemetry payload is built from an explicit field allowlist that the survey object isn't in. Free text can't reach the telemetry endpoint by accident regardless of what the prototype logs.

Some rules I held myself to: play is never gated on consent, declining is remembered so nobody gets re-asked into submission, and the whole thing degrades to a fully local mode where the feedback report is a file you download and email me if you want, which is how the first rounds worked and which keeps working forever.

The detail in the harness that was interesting to consider and solve for is that telemetry sends a beacon when the page hides, not just when someone clicks a button. If players close the tab mid-run, that's a signal I need to know about. The abandoned sessions can be the most informative ones, because they're where the game lost someone. The earlier prototype only captured data from people polite enough to finish and press a button, which is a survivorship filter (all of our planes come back with bullet holes around the cockpit but never in it) exactly where you can't afford one.

What never gets collected, and the on-screen copy makes this clear: IP address, cookies, any persistent identifier, user agent, referrer, location. No analytics script, no font CDN, no third-party request of any kind. A session ID is random per page load and stable across nothing.

<!-- TELEMETRY ENDPOINT STATUS: [VERIFY before publish] one sentence on the collector —
     live Go collector on the cluster, or "endpoint lights up soon, download path works today" -->

## What the last round found

Three people have played these prototypes so far: me, a friend who does automation engineering for a living, and my wife. That's a smoke test, not a sample size, but a designer and two people who owe me nothing converging on the same findings is signal enough to act on.

The rival hacker, the AI racing you for the same data, scored 1 out of 5 from both testers who filled the form. Worst score on either sheet. Both of them also named racing the rival as their favorite moment in the game. That contradiction is the most useful note anyone has given me on this project. The rival is the best moment generator in the game and simultaneously its worst system, because it dies too early, killing it costs nothing, and half of what it does is invisible behind the fog. Fixing that tension is now the top of the design queue.

Second: the whole screen didn't fit at a normal laptop resolution, and the tester spent the session scrolling between the trace meter and his hand. A player managing a threat they can't see isn't playing the tension game at all, which plausibly dragged every other rating down with it. Layout is a hard constraint now.

Third, and my favorite... My wife played a build I already knew was broken. She hit the breakage, found a workaround on her own, and kept going, because she'd decided she was going to beat it. She does not like video games. They stress her right out. I couldn't have designed a better test of whether the loop generates motivation, and I didn't design it at all.

## What actually happens next

The Godot build starts now, version-pinned, with the test gate already vendored and a determinism harness as the first milestone, because seeded replay is what makes future playtests comparable instead of anecdotal. Windows and Linux are both release-blocking. There's no ship date and no Steam page, and there won't be either until there's a vertical slice that earns them. The prototypes stay up regardless, because they keep answering questions cheaper than the engine can.

I'm planning roughly one of these posts a month, which is the best cadence I can afford to muster for a project built around a [full-time job](https://www.linkedin.com/in/maxfield-allison/), a [FOSS project](/blog/why-i-built-dnsweaver) that needs maintaining, and a [homelab](/labs) that periodically demands attention. Design decisions and why, playtest results including the embarrassing ones, engine work once there's engine work. They'll be tagged [zeroday](/blog/tags/zeroday) if you want just this thread. There's an [RSS feed](/rss.xml), and I read everything sent to [hello@probablyfine.dev](mailto:hello@probablyfine.dev).

One note on process, since this blog is where I'm honest about it: AI assists the engineering, the documentation, and the research on this project. The art, music, and voice will be human-made. That line doesn't move.

If you play the prototype and it bores you, or confuses you, or you delete the rival on turn one and coast to the exit, that's exactly the feedback I want. Correct me about my own game.

It's probably fine. Let's find out.
****
