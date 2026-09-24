---
title: "Why I created null"
description: "From my original dictation to an edited draft and a revised article: why I created a skill that asks AI to wait while I think."
date: 2026-09-23
tags: ["ai", "writing", "null"]
aiRole: drafted
draft: false
---

For roughly three months now, I’ve been heavily using AI agents. Before that, I used chats fairly regularly to create applications and small tools, copy-pasting back and forth between an IDE and Claude or ChatGPT. One of the things that came out of that progression is a skill called null. It asks the AI to reply “Received.” while I think out loud, then do the work when I specifically ask for something. I wanted to choose when it started contributing.

Then I started using agents in my homelab. Once I was able to implement things at a rapid pace, including building out my Kubernetes lab and migrating my services from Docker Swarm, something became apparent: those little ideas, or solutions to problems I was dealing with, were things I could turn into software with the agents available at the time. Not just bespoke code solutions to individual issues, but actual engineered solutions that were broader and applied to anything within the domain of the problem they were built to solve.

I started with my understanding of software engineering and how software functions, then used agents to research and establish best practices. That became my first AI harness, which was essentially a set of Copilot instructions, some of which applied when a file matched a particular pattern. Those instructions have since migrated into skills, including an engineering assurance skill for planning before substantial implementation and reviewing implemented work before release.

Slowly but surely, I’ve built a more comprehensive harness around the coding agents I use, namely Codex and Claude. If you look at my GitLab activity over the past several months that I’ve been using agents, it’s essentially a solid white box. I’ve been iterating, designing, and planning practically every little thing that pops into my head, and I’m getting close to releasing a couple of projects I’ve been working on for some time.

Working on those projects has also meant continually improving the harness. That’s become a project in its own right, one I hope to make public eventually, though I’m not ready to talk about it quite yet.

Part of creating what I consider an effective harness is keeping up with AI research and development, including the related social and psychological research. There are studies directly relevant to the design choices I’m making, and I think it’s important to cross-check myself and vet whatever hypotheses I come up with. Odds are I’m not the first person to have thought about something. There’s also a good chance that my explanation is way off base for some very good reasons.

Which brings me to an ongoing conversation with my wife.

She’s concerned about how much time I spend interfacing with AI. She has very good reasons to be concerned about how much time I spend on anything. Say the words “Dota 2,” as in Valve’s online MOBA, then step back and watch her reaction.

Don’t worry, I won’t leave you hanging. I have about 5,000 hours in that game.

But I digress.

Our conversations forced me to consider more deeply what effect AI is having on me. Being the person I am, I felt I had some well-thought-out arguments for why the time and effort I’ve put into working with and understanding these systems wasn’t the same problem we’ve all seen discussed online and in news articles. I’m talking about things described as “AI psychosis,” along with deskilling and offloading cognition to the machine. Those questions grew out of our conversation, but they don’t settle her concern about the time itself. Null doesn’t answer that either.

Most of my argument has been that how someone engages with AI matters. I’ve written about [AI amplifying what was already there](https://probablyfine.dev/blog/written-by-no-one) before. I think AI is a multiplier. I was also making an argument about myself: I thought that being willing to question my own ideas and check what the model told me would help protect against the problems my wife was worried about. That was my reasoning, but it isn’t evidence that I’m protected. The studies discussed here don’t establish a protective personality profile or tell me what is happening to me. They also don’t establish a cause of psychosis.

I should also define what I mean by AI, because that word seems to mean something different to everyone. Here, I’m talking about large language models. In my fairly informal description, they’re incredibly good guessing machines built out of the magic of statistics. More precisely, models of this kind learn patterns during training and generate text by predicting tokens, which can be words or parts of words, conditioned on the text they’re given. That distinction between training and the current prompt matters. [Brown et al., 2020](https://arxiv.org/abs/2005.14165).

After our most recent conversation, I decided to do another pass through the research, specifically looking at how AI might harm human cognition. Does it? To what degree? What does the science actually say?

What I found was: it depends.

Go figure.

I had read the papers. For this version of the article, I asked AI to check the studies I was referring to and fill in the references. We then went back and forth over the draft, including the difference between my original claims and the qualifications it had added.

The math study involved nearly 1,000 high-school students. Both GPT-4 tools helped them perform better during practice. But when the AI was taken away, the group using the less constrained tool scored 17% below the control group. The tool built around teachers’ tutoring guidance largely avoided that penalty, though it didn’t produce a statistically significant improvement on the unaided exam. Students using the less constrained tool also didn’t recognize how much worse their learning and performance had been. That’s a short-term learning result; it doesn’t tell me what months of using coding agents have done to me. [Bastani et al., 2025](https://doi.org/10.1073/pnas.2422633122).

The colonoscopy study was a retrospective before-and-after comparison at four Polish centres. Across 1,443 procedures performed without AI, the proportion detecting at least one adenoma fell from 28.4% before AI was introduced to 22.4% afterward: six percentage points. That raises a concern about deskilling, but this observational comparison cannot establish that AI caused the decline. It also studied a medical detection tool, not a conversational language model. [Budzyń et al., 2025](https://pubmed.ncbi.nlm.nih.gov/40816301/?dopt=Abstract).

Granted, colonoscopies are a slightly different use case from what I assume the average person is doing with AI. lol.

Over the next couple of days, I kept thinking about what I’d read and began incorporating that research into how my harness functions. At one point, as I was getting into the shower, I had a thought.

I’ve spent a lot of time teaching people, especially at work, how to use AI effectively. Even during the chat phase of my own use, one of the things I talked about was what I called “context poisoning”: the information and framing you give a model can affect what comes out. I’m using that phrase informally here. A prompt influencing a response is normal model behavior; it doesn’t require malicious input or mean that every part of a prompt changes every answer.

Sure. Duh.

But you aren’t the only one supplying input. There’s the system prompt, any instructions or skills the system loads, and whatever else the product puts behind the scenes that we don’t necessarily see. Not to be conspiratorial about it. And beyond the immediate context, there’s the training data that shaped the model in the first place.

All of that affects the output. The way you ask a question can steer the response toward solution A rather than solution B. It might never mention solution B at all. If you didn’t know solution B existed, you’ve unwittingly missed the opportunity to learn about it. There’s a related, studied failure mode here: sycophancy. Sharma and colleagues found that assistants sometimes favored answers agreeing with a user’s stated beliefs over truthful ones. [Sharma et al., ICLR 2024](https://arxiv.org/abs/2310.13548).

I realize that’s always a possibility, but finding unknown unknowns is one of the things I find most useful about AI. I’ll often give it a vague question with instructions to search widely, including things that might not initially seem related. I want that information so I can judge it for myself, because these models aren’t something I’m willing to trust at face value.

That brought me back to my wife’s concerns.

These models are trained on human statements, thoughts, and words. Their responses can reproduce ways that humans communicate and influence one another. If we can “poison” a model’s context, could it do something similar to ours?

Could it affect what I’m considering, what I’m overlooking, and how I’m arriving at a decision?

That prompted another round of research. The human “context window” is my analogy, not a claim that human memory works like an LLM. Two relevant papers address different parts of that question.

Glickman and Sharot studied 1,401 participants across experiments involving perceptual, emotional, and social judgments. Biased systems increased bias in people’s judgments, and participants underestimated some of that influence. Accurate systems could also improve independent judgments. These experiments used several kinds of systems, including hard-coded algorithms and image generation; they weren’t a test of extended conversations with coding agents. [Glickman and Sharot, published online in 2024, journal issue 2025](https://www.nature.com/articles/s41562-024-02077-2).

For conversational language models, Salvi and colleagues ran a randomized study with 900 participants in short debates. GPT-4 given personal information was more persuasive than the human baseline. However, a September 2026 correction says its advantage over GPT-4 without personal information was not statistically significant. It also doesn’t tell us what happens over months of ordinary agent use. [Salvi et al., 2025](https://www.nature.com/articles/s41562-025-02194-6); [2026 correction](https://www.nature.com/articles/s41562-026-02588-0).

That’s what led me to attempt an admittedly ham-fisted solution: the null skill.

My thinking was that if the AI stopped volunteering things I hadn’t asked for, maybe I could limit how much it influenced my own decision-making context. The [skill’s instructions](https://github.com/maxfield-allison/null/blob/main/SKILL.md) ask it to respond to the operation I actually requested, while leaving the things I hadn’t supplied unresolved. While I’m thinking aloud, it should say “Received.” An explicit request permits the requested work, then it returns to quiet behavior.

Those are instructions, not a guarantee. Null doesn’t erase earlier context, remove the effects of training, override higher-priority instructions, or make the model neutral. An outline or critique I ask for can still change the direction I take. Staying quiet could also mean it withholds a suggestion I would have found useful. I still want that help when I ask for it. Whether choosing when it contributes reduces unwanted influence remains a hypothesis.

I dictated the original version of this article into a Codex session in VS Code using Handy, with null mode active, on September 23. It was my first real use of null. My impression was that it forced me to think through what I was doing. Later in the same conversation, I turned null off and asked for a review. I could decide when I wanted the model’s opinion, even though that doesn’t tell me how much it influenced me.

That’s a personal observation from one attempt. The [repository’s testing note](https://github.com/maxfield-allison/null#testing) records 20 written behavioral checks, nine of which were run once each against an earlier version. Those check instruction-following, not cognitive outcomes. A few synthetic tests, some anecdotal evidence, and a selection of research papers do not turn my idea into an accepted theory. I don’t know whether this will make a meaningful difference beyond what I’ve noticed while using it to dictate this article.

That uncertainty is part of why I published the skill and wanted to write about it. It’s also why I want to share this on every social service I have the stomach to use.

X.com can kiss my ass.

I’m hoping it reaches enough people to hear how it works for them. I also hope it encourages people to take the time to think and reason through things they care about.

The studies are linked above so you can read them for yourself. You can find [null and its instructions on GitHub](https://github.com/maxfield-allison/null). Give it a try if you’re interested. Tell me what you were trying to do and whether the waiting helped or just got in the way.

**How this one was made.** I dictated the original using Handy with null mode active, then asked Codex to shape it into an article. I corrected two passages and clarified that I had read the papers. At my request, Codex checked sources, filled in research details, and wrote the added summaries and qualifications. After I turned null off, I asked for its critique and agreed to another editing pass. This revised article went through several exchanges; the original dictation and first edited draft are preserved for comparison. Codex also wrote the comparison document and built the page. The personal experience and reasons for creating null are mine; the added prose and implementation were written by Codex.
