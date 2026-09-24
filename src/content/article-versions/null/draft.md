---
draft: true
---

For roughly three months now, I’ve been heavily using AI agents. Before that, I used chats fairly regularly to create applications and small tools, copy-pasting back and forth between an IDE and Claude or ChatGPT.

Then I started using agents in my homelab. Once I was able to implement things at a rapid pace, including building out my Kubernetes lab and migrating my services from Docker Swarm, something became apparent: those little ideas, or solutions to problems I was dealing with, were things I could turn into software with the agents available at the time. Not just bespoke code solutions to individual issues, but actual engineered solutions that were broader and applied to anything within the domain of the problem they were built to solve.

I started with my understanding of software engineering and how software functions, then used agents to research and establish best practices. That became my first AI harness, which was essentially a set of Copilot instructions, some of which applied when a file matched a particular pattern. Those instructions have since migrated into skills, including an engineering assurance skill with different modes for reviewing work after design, before implementation, and after implementation.

Slowly but surely, I’ve built a more comprehensive harness around the coding agents I use, namely Codex and Claude. If you look at my GitLab activity over the past several months that I’ve been using agents, it’s essentially a solid white box. I’ve been iterating, designing, and planning practically every little thing that pops into my head, and I’m getting close to releasing a couple of projects I’ve been working on for some time.

Working on those projects has also meant continually improving the harness. That’s become a project in its own right, one I hope to make public eventually, though I’m not ready to talk about it quite yet.

Part of creating what I consider an effective harness is keeping up with AI research and development, including the related social and psychological research. There are studies directly relevant to the design choices I’m making, and I think it’s important to cross-check myself and vet whatever hypotheses I come up with. Odds are I’m not the first person to have thought about something. There’s also a good chance that my explanation is way off base for some very good reasons.

Which brings me to an ongoing conversation with my wife.

She’s concerned about how much time I spend interfacing with AI. My wife isn’t particularly technical, but she also has very good reasons to be concerned about how much time I spend on anything. Say the words “Dota 2,” as in Valve’s online MOBA, then step back and watch her reaction.

Don’t worry, I won’t leave you hanging. I have about 5,000 hours in that game.

But I digress.

Our conversations forced me to consider more deeply what effect AI is having on me. Being the person I am, I felt I had some well-thought-out arguments for why the time and effort I’ve put into working with and understanding these systems wasn’t the same problem we’ve all seen discussed online and in news articles. I’m talking about things described as “AI psychosis,” along with deskilling and offloading cognition to the machine.

Most of my argument has been that how someone engages with AI matters. I’ve written about this on the blog before: I think AI is a multiplier. My argument was that if someone was already lazy, impressionable, or easily influenced, AI could amplify those traits and create additional problems. On the other hand, if someone was already a deep thinker, self-critical in a productive way, they might already have some of the habits and self-checks that help prevent the problems my wife is worried about.

I should also define what I mean by AI, because that word seems to mean something different to everyone. Here, I’m talking about large language models. In my fairly informal description, they’re incredibly good guessing machines built out of the magic of statistics.

After our most recent conversation, I decided to do another pass through the research, specifically looking at how AI might harm human cognition. Does it? To what degree? What does the science actually say?

What I found was: it depends.

Go figure.

One study I read suggested that, depending on how the assistance was set up, AI could be an excellent tool for studying things like math. It could also leave students overestimating their capabilities and performing much more poorly when tested without that assistance. Another study, involving AI assistance for colonoscopies, raised a similar concern about skill loss.

[Add the math and colonoscopy studies and check the descriptions of their findings.]

Granted, colonoscopies are a slightly different use case from what I assume the average person is doing with AI. lol.

Over the next couple of days, I kept thinking about what I’d read and began incorporating that research into how my harness functions. Then, last night, as I was getting into the shower, I had a thought.

I’ve spent a lot of time teaching people, especially at work, how to use AI effectively. Even during the chat phase of my own use, one of the things I talked about was what I called “context poisoning”: whatever you put into the model affects what comes out.

Sure. Duh.

But you aren’t the only one supplying input. There’s the system prompt, any instructions or skills the system loads, and whatever else the product puts behind the scenes that we don’t necessarily see. Not to be conspiratorial about it. And beyond the immediate context, there’s the training data that shaped the model in the first place.

All of that affects the output. The way you ask a question can steer the response toward solution A rather than solution B. It might never mention solution B at all. If you didn’t know solution B existed, you’ve unwittingly missed the opportunity to learn about it.

I realize that’s always a possibility, but finding unknown unknowns is one of the things I find most useful about AI. I’ll often give it a vague question with instructions to search widely, including things that might not initially seem related. I want that information so I can judge it for myself, because these models aren’t something I’m willing to trust at face value.

That brought me back to my wife’s concerns.

These models are trained on human statements, thoughts, and words. Their responses can reproduce ways that humans communicate and influence one another. If we can “poison” a model’s context, could it do something similar to ours?

Could it affect what I’m considering, what I’m overlooking, and how I’m arriving at a decision?

That prompted another round of research. I found work that seemed relevant to that question, though I need to return to the sources before describing exactly what it establishes.

[Add the research on AI influence and human decision-making here.]

That’s what led me to attempt an admittedly ham-fisted solution: the null skill.

My thinking was that if the AI stopped volunteering things I hadn’t asked for, maybe I could limit how much it influenced my own decision-making context. It would respond to the operation I actually requested, while leaving the things I hadn’t supplied unresolved.

Maybe that would give me more room to think.

I’m dictating this article into an AI session in VS Code using Handy, with null mode active. This is the first time I’ve used it for anything real since creating it yesterday. My experience so far is that it forces me to think through what I’m doing. I have to work through what I want to say.

That’s a personal observation from one attempt. A few synthetic tests, some anecdotal evidence, and a selection of research papers do not turn my idea into an accepted theory. I don’t know whether this will make a meaningful difference beyond what I’ve noticed while using it to dictate this article.

That uncertainty is part of why I published the skill and wanted to write about it. It’s also why I’m bothering to share this on every social service I have the stomach to use.

X.com can kiss my ass.

I’m hoping it reaches enough people to give me some additional data points. I also hope it encourages people to take the time to think and reason through things they care about.

I’ll link the studies and probably my research summaries here so you can read them for yourself. Give null a try if you’re interested. I’m very interested in whether it makes any difference at all.

[Add the null skill link, studies, and research summaries.]

*How this one was made: I dictated the source material using Handy with null mode active, then asked AI to shape the dictation into an article. The research references are still placeholders in this draft.*
