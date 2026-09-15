---
title: "There's a story in all these conversations"
description: "Working with AI leaves a record of questions, decisions and attempts. I'm trying to turn some of mine into a history worth reading."
date: 2026-09-15
tags: ["ai", "homelab", "writing", "history"]
aiRole: drafted
draft: false
---

I looked at the activity calendar on [my GitLab profile](https://gitlab.probablyfine.dev/maxfield-allison) and the last month was effectively a solid block. I wanted to take a longer view of what I'd been working on, and there was so much activity that the calendar couldn't tell me much beyond the fact that I'd been busy.

<figure>
<a href="https://gitlab.probablyfine.dev/maxfield-allison"><img src="/images/the-story-in-the-record/activity-calendar.png" width="958" height="184" alt="GitLab activity calendar showing a dense block of activity in August and September." decoding="async" /></a>
<figcaption>My GitLab activity calendar on September 15, 2026. Each square is a day.</figcaption>
</figure>

I've been working with AI agents across a lot of projects in my homelab. Some of the conversations start with a specific thing that needs fixing. Others start like this one did, with me dictating an idea and trying to figure out what I mean as I say it. We discuss it, research what already exists, change direction, and eventually get down to building something. The agents write code, run tests and leave notes. I ask questions, review what comes back and make decisions. And while we're doing that, I keep having other ideas. AI makes it easy to follow some of those little tangents, explore whether there's something worth doing, and keep the idea saved with enough context that I can come back to it. Sometimes we can move it forward a bit before I'm ready to really focus on it. So when I ask to be brought back up to speed on a project, it's often because I've been following several of these threads and need help finding where I left off. All of that produces a record, spread across transcripts, issue comments, commits and documents, and the record keeps growing while we're using it to do more work.

There's a ridiculous amount of source material in there. I want to use some of it to explain how these things came to be in a way that someone would enjoy reading.

Last Tuesday I wrote about [the games that got me into computers](/blog/i-just-wanted-to-play-games). I felt it was important for me to write that one myself. AI helped with research and editing, and before that Claude had helped me find some obscure games I remembered playing as a kid. This piece is different in a way I want to make visible. I'm dictating my thoughts and working with AI to turn them into something cohesive, where the ideas flow in an order that makes sense to someone who wasn't there for the conversation. That gets me from an idea through an outline and a draft much more easily, while still leaving me responsible for deciding whether it says what I mean.

The game search started with memories of a disc collection. I remembered Chrysanthemum by name, a game that turned out to be TaskMaker, and little images of other things I'd played. Armor was one of those, a tank game I thought might have been turn based. Claude found so little useful information about it on the web that the search eventually reached the application's own files, where its creator, Brad Sanders, had left instructions and credits.

I love that those words survived along with the game. Someone wrote them for the people who would play it, and here we are reading them decades later after finding the application on an archived disc. It brings back that whole way of finding software through magazine discs and box sets, copying things and sharing them with other people.

<figure>
<blockquote>
<p>If you are interested in programing color games I am selling the source code for 25$.</p>
<p>[…]</p>
<p>I would like to Thank AFCMacFun for all of his encouragement and especially John Calhoun for being my program Guru.</p>
<p>[…]</p>
<p>I hope that you enjoy this game.     -- Brad Sanders</p>
</blockquote>
<figcaption>Selected words from Brad Sanders's text inside <a href="/arcade/armor">Armor 1.1</a>, © 1991. Original spelling preserved; omissions marked.</figcaption>
</figure>

While preparing this post, Codex found the original conversation and went back through the search results inside it. It included the clues I'd supplied, the guesses that didn't hold up, and the tools Claude built to look inside the discs. It also included me saying that we should save all the detail because there was a whole thread of posts we could make from it. That's exactly the sort of tangent I'm talking about. We were still finding the games, I had an idea about what else we could do with the work, and now I'm coming back to it with the conversation still there to build from.

## I want to be able to read it

The working name is Chronochasm, borrowed from Neal Stephenson's *Anathem*. In the book it's [the space inside a clock tower that houses its workings](https://anathem.dlma.com/data/Chronochasm.html). I like that for a view where you start with time and work your way into what happened. I have a private version that brings dated records together, and [this first public preview](/chronochasm) gets closer to the experience I have in mind. I want to be able to read the story of the work and understand how an idea became something I could use.


I imagine opening a page and seeing activity spread across a timeline. Zoom in and the different projects become clearer. Go into one and you can see what it was trying to accomplish, where it changed direction, and how the work developed. Keep going and you're reading a chapter. A section might follow one problem through a conversation, an attempted fix, a test that exposed something else, and another attempt. If a passage makes you curious, you can open the exchange behind it and eventually reach the particular source that supports it. You could also enter at the chapter and just read. It's almost like zooming into a book, from the whole thing down to a page, and I'd want to be able to follow the story without opening every source. The writing has to carry it. The detail would be there when someone wants to understand a decision more closely, or when something sounds a little too neat and they want to see what happened. Some weeks might only need a paragraph. A conversation that changed the direction of a project might deserve several pages.

<figure>
<a href="/chronochasm#keep-record"><img src="/images/the-story-in-the-record/chronochasm-reading.png" width="1800" height="1050" alt="Chronochasm's vertical timeline beside the passage Save this. There are posts in it., with previous and next passage controls and a link to the source exchange." loading="lazy" decoding="async" /></a>
<figcaption>The search was still going when I asked to save the detail for future posts. <a href="/chronochasm#keep-record">Read that moment in Chronochasm.</a></figcaption>
</figure>

Facebook's memories are probably the most familiar comparison I can think of. If you've used it for years, a picture can bring back what you were doing on this day a decade ago. These conversations preserve a different kind of detail. There's a question I was trying to answer, the explanation that helped, or the point where an idea started becoming something I wanted to build. For me, a lot of that is homelab work. Someone who uses AI heavily for another kind of project could have material just as interesting in their own history.

That doesn't mean every afternoon configuring something needs to become a chapter. Most of it is ordinary work. I tend to get excited in those first conversations when an idea is taking shape. Later I'm more likely to be satisfied that something works, confused about a particular part, or focused on getting through it. I'm considering dictating some journal entries alongside the work so those observations have somewhere to go too.

## Checking the Record

The game search provides a useful example of what can go wrong. Claude reported a hit for Chrysanthemum, then inspected the full file path and discovered that it had found Renoir color palettes.

Both the announcement and the correction survive in the same transcript. A history assembled from the first confident summary would send the reader down the wrong path. Quoting an agent accurately doesn't establish that what it said was accurate.

I've also started giving the agents their own identities on the systems they use. That helps distinguish their work from mine, especially when we come back to it later. I directed the game search; Claude wrote and ran the search tools. I can explain what I was looking for and recognize what came back. A chapter should preserve those different contributions.

There's room for interpretation, of course. Deciding which conversation matters and how it connects to the next one is part of writing. Working through that with AI means supplying the context it doesn't have and correcting the places where it has made connections based on assumptions I don't agree with. It's important to acknowledge the things we don't know, including the questions we haven't thought to ask yet. I like the distinction between known knowns, known unknowns and unknown unknowns. A convincing story can make it easy to forget that the last category exists.

Going through this process has also brought back more of the memories. I now remember the Mac box set, putting the discs into the drive, the games mixed in with other software. There's even a little house from a 3D modeling program that I can picture again. Finding the games gave me things to connect those scraps of memory to, and there are still vague bits that I can't quite grab. Working through them has been incredibly rewarding. It's been nice to remember this shit.

## Talking through it

So this piece is intentionally AI-assisted. I've written about [how I use AI](/blog/how-i-use-ai) before, and here the collaboration is specifically something I'm trying to demonstrate. I dictated the idea, we discussed what the story for this post should be, and Codex went back through the surviving material and helped turn it into a draft. Then I read it and dictated another long response about the parts I agreed with, the things it had missed, and what I would actually say. Some of what you're reading came out of that second conversation.

Dictation with [Handy](https://github.com/cjpais/Handy), using a local speech-to-text model, has been an absolute game changer for my writing. I can speak much faster than I can type, but it's also a different way of getting the thoughts out. When I'm typing, I'm thinking about each word as I put it down. When I'm talking, I can follow an idea, lose my train of thought, find it again, and end up saying something I didn't know I was trying to get to when I started. You can probably imagine what the unedited transcript of this post looks like. There's useful stuff in the tangents, though, and giving the AI all of that means it has much more of my actual thinking to work with when it helps me put the piece together. I can read what comes back and say that a point is missing, or that I wouldn't put it that way, and talk through why until we have something closer to what I mean. That back and forth is making the result much better than it would be if I gave it a short prompt and accepted whatever came back. To me, that's a big part of the difference between an AI-assisted piece that carries some meaning and a piece of slop.

The first chapter in [Chronochasm](/chronochasm#remembering) follows the search for those discs and games, with Armor as the part we look at closely. Its obscurity is what makes it such a good example. We had to go digging through the discs and into the application to find out what it was, and I think being able to do that kind of digital archaeology with AI is just so fucking cool. Finding something this obscure makes me want to write about it. It's a small enough piece of history to give this a try, and it connects to something you can already explore in the arcade.


This is the beginning of a few things I've been thinking through and building around how I work with AI. I want to give them the time and care they need, and this first chapter is a way to start sharing some of that work.

If you've used AI to find something you could barely remember, I'd love to hear what it was and how you found it.

---

**How this one was made.** I dictated the ideas for this post using Handy and discussed the outline and example with Codex. Codex researched the surviving records and wrote the first draft. I read it and dictated detailed edits, corrections and additional thoughts, which Codex used to revise the draft. I reviewed the post and the companion, including the source selections. The Chronochasm passages were also drafted by Codex from the original Claude conversation, retained search output, issue records and subsequent corrections. The [AI labels and process notes](/ai) describe the role the tools played in each piece.
