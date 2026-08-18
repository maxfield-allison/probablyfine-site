---
title: "ZERO/DAY, and why there's no code yet"
description: "I'm building a hacker roguelike deckbuilder about the kind of networks I actually work on. Eleven commits in, none of them are gameplay. Here's the game, the rule it's built around, a browser prototype you can play right now, and the dev blog that's going to follow it."
date: 2026-08-11
tags: ["zeroday", "gamedev", "godot", "playtest"]
aiRole: drafted
draft: true
---

The repository has eleven commits in it. Not one of them is gameplay code.

That's the honest state of ZERO/DAY as of this post, and I'd rather open there than open with
a trailer voice. What exists is a Godot project that won't run yet, a stack of design and lore
docs, and a browser prototype that plays well enough to have already told me something I
didn't want to hear. You can play that prototype at the bottom of this post.

## What it is

ZERO/DAY is a hacker roguelike deckbuilder. The shortest honest pitch is Slay the Spire meets
Netrunner, framed with the tactile unease of Inscryption.

You're a hacker working contracts. Each job is a network you have to get into, cross, take
something from, and leave. The board is a node graph. You spend cycles to move between hosts,
you play cards to deal with what's in the way, and a trace meter climbs the whole time you're
in there. Hit the ceiling and that operator is burned.

Between jobs you're in the den, which is a room with a lamp and a desk and some animals in it,
picking up your next contract and adding one tool to your kit.

## The rule the whole thing is built on

Here's the part I actually care about, and the reason I think this game is worth building
instead of just playing something else.

Every visual element and every piece of fiction has to be explainable as a rendering of
something a real tool could know or do. I've been calling it the CLI test. If I can't explain
a mechanic in network terms, it doesn't ship.

The in-fiction justification is that the board is the hacker's own dashboard. It's their bash
aliases made visual. That's why the map looks the way it looks, and that's why fog of war isn't
a magic spell. You can't see a host you haven't scanned because you haven't scanned it.

This kills a lot of cool ideas, and I've killed a few already. It also means I'm not defaulting
to neon and rain. The aesthetic I'm chasing is ten minutes into the future and twenty years out
of fashion. Old tools, chosen deliberately, because old interfaces don't phone home.

The other half of the same rule: opaque story, transparent systems. You're allowed to be
completely bewildered about what the thing at the bottom of the network is. You are never
allowed to be confused about what a card does.

## Why this game, from me

I've spent seven years building and breaking a homelab, and the day job is close enough to the
same shape. Subnets, ICE that's really just a firewall rule someone wrote on a Tuesday, an
alert that fires because you were loud. I've been on both sides of that. The sysop on the
other end of one of these jobs is not a villain in my head, they're a person with a ticket
queue, and I want the game to keep treating them that way.

The stuff I already know is the stuff the game is made of. That's not the usual reason people
pick a genre, but it's the reason this one stayed interesting past week two.

## The tech, and the constraints I locked early

- **Godot 4.7.1**, pinned in a `GODOT_VERSION` file at the repo root so CI and my machine can't
  quietly disagree. GDScript for most of it.
- **Rust through gdext** later, for a compiled tier. This is specifically for secrets and
  derived content. I looked at C# for that and dropped it, because C# compiles to IL that
  decompiles cleanly, so it buys no obscurity at all. Rust gives me native machine code.
- **A Go backend, in a separate repo**, for an async collective tally and some other things.
  The game has to degrade gracefully offline. The backend is never required to play.
- **Windows and Linux are both release blocking.** Steam Deck is a first class target, not a
  port task. Given who I expect to play this, over indexing on Linux is just reading the room.
- **Controller support day one**, and everything content side is data driven. Cards, boards and
  contracts are Godot Resources, never hardcoded, because Steam Workshop support is a ground up
  requirement and retrofitting modding is how you end up rewriting your content pipeline.

Most of those are decisions I'd rather be held to in public than quietly walk back later.

## Why eleven commits and no code

Because I went looking for the design before I started building it, and then an audit found
that the design had a hole in it.

I consolidated my design docs a few times as they grew. Every changelog I wrote listed what got
added. None of them listed what got dropped. Somewhere across three of those consolidations the
entire encounter layer went missing, which is to say the actual moment to moment game, and it
survived only in archived versions. I found it by doing a cold read of my own repository and
noticing that two live documents both referenced a system that no live document defined.

That's now recovered and rewritten as its own doc. The lesson stuck harder than the fix did:
a consolidation changelog needs a "dropped or deferred" section, not just an additions section.
I'd have caught it four versions earlier.

So the docs came first. I'm fine with that. Writing engine code against a design with a missing
middle is a good way to spend a month.

## The prototype

While the docs were getting sorted out I kept a browser prototype running, because paper can't
tell you whether a turn feels good.

It's real. Boards generate, ICE blocks you, a rival hacker races you for the same data, the
trace climbs and eventually gets you. There's a den between jobs and a draft. It is not the
Godot game and it never will be, it's a testbed for whether the loop works.

**[Play ZERO/DAY playtest v8](/zeroday/playtest-v8)**

A few notes before you click:

- Give it a real screen. The board plus the HUD plus your hand need room, and a laptop in a
  small window will fight you. A previous version of this prototype failed exactly that way in
  testing and it suppressed every other rating on the feedback form.
- Read the fixer's intro once. It's short, it's in character, and it covers movement, noise,
  trace, and what the red shapes mean.
- The entry vector choice at the start of a job is the newest thing in here and the thing I
  most want opinions on. Loud is fast and central. Quiet is slow and costs you tempo, and the
  corp barely notices you.

When you're done there's a feedback panel that builds a report. It captures your drafts, your
plays, your entry vector choices, your trace curve and your timings. Nothing uploads anywhere,
you copy or download it and send it to me. Send the report even if you skip the written
questions, because the play data is genuinely the most useful half.

<!-- TODO: replace with the real destination before publishing. The prototype's own copy
     currently says "send to Max" with no address, which works for two friends and not for a
     blog audience. Options: a mailto, a form, or a GitLab/GitHub issue link. -->

I already know one thing this build is probably still wrong about. In the last round of
testing, the rival hacker scored 1 out of 5 from both testers, the worst score on either form.
Both of them also named racing the rival as their single favorite moment in the game. That
contradiction is the most useful thing anyone has told me about this project so far, and I'm
not confident v8 has actually solved it. Tell me if it hasn't.

## The dev blog part

This is the first of these. I'm planning roughly one a month, which is the honest cadence for
a project I work on around a full time job and a homelab that periodically demands attention.

The plan is to write about what actually happened, including the parts where I was wrong.
Design decisions and why, playtest results even when they're bad, the engine work once there
is engine work to write about, and whatever the prototype teaches me between now and then.
These will be tagged `zeroday` if you want to follow just this thread.

If you play the prototype and it's boring, or confusing, or you deleted the rival on turn one
and coasted to the exit, that's the feedback I want. Correct me where I'm wrong about my own
game.

It's probably fine. Let's find out.
