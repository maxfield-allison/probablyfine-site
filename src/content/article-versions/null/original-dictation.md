I'll start from the beginning. For roughly three months now, I have been heavily using AI agents. Before that, I was using chats fairly regularly. I was creating applications or small tools using chat and just copy-pasting back and forth between an IDE and Claude or Chat GPT.

And then I started using the agents in my home lab and once I was able to begin implementing things at a rapid pace, like my Kubernetes lab and migrating all of my services rapidly from Docker Swarm to Kate's, it became apparent to me that these little ideas that I would have tangentially for applications or solutions to problems that I had were certainly able to be accomplished effectively with the state of AI agents as it was at the time.

I started with my understanding of software engineering and how software functions, and began using agents to research and establish best practices and create what you would call my first AI harness, which was essentially just a set of co-pilot instructions with some that would apply on a glob match. Those same instructions have been migrated into skills, like an engineering assurance skill that has different modes for post-design, pre-implementation, and post-implementation.

And I've slowly but surely begun to build a more comprehensive and feature-rich harness around the coding agents that I use, namely Codex and Claude. If you look at my GitLab activity, you'll see that it's essentially a solid white box. I have been iterating and designing and planning every little thing that pops into my head, and I'm at the point where I'm very close to releasing a couple of projects that I've been working on for some time now.

Through my experience working on all of these projects, I've continued to improve and iterate the harness. And that in and of itself is a project that I hope to bring out publicly at some point, though I'm not ready to talk about it quite yet.

Part of creating what to me is an effective harness is ensuring that I not only stay up to date with the frontiers of artificial intelligence research and development But also the related social and psychological research. There are a number of studies that are applicable directly to the design choices that I am making I feel that it's important to cross-check myself and thoroughly vet any hypotheses that I come up with. Odds are I'm not the only one who's had a thought like X before, and odds are even greater that the thought that I had about X is way off base for some very good reasons

Now, that said, I recently came upon some interesting research in relation to an ongoing conversation that my wife and I have been having. My wife is concerned. She's concerned about the amount of time that I'm spending interfacing with AI. While I love my wife, obviously, she's not exactly a technical person. And she also has very good reasons for being concerned about the amount of time that I'm spending on anything. Say the word, the words Dota two, as in valves online MOBA game and then step back and watch her reaction. Don't worry, I won't leave you hanging. I have about 5,000 hours in that game.

But I digress. Our ongoing conversation around the amount of time I've been spending using AI systems forced me to deeply consider the effect that AI is having on me and being the person that I am, I felt that I had some well-thought-out arguments as to why, in my case, the amount of time and effort I've been using the amount of time and effort that I have put into working with and understanding AI systems is not the same problem that I'm sure most people have seen posted about online or in news articles. Specifically, I'm talking about things like AI psychosis and problems like de-skilling, offloading cognition to the machine

Most of my arguments to my wife have been essentially that in those situations where somebody is using AI to a fault, it has a lot to do with the way that they engage with it. I've written about this on this blog before, but I will say it again: AI is a multiplier. If somebody was lazy or influenciable, impressionable before AI, then AI only accentuates those traits and causes additional issues as we've seen.

I also think it's important here to define what I mean when I say AI because it seems to mean a different thing to different people. What I'm talking about is large language models that are basically incredibly good guessing machines built out of the magic of statistics

On the other hand, if you are already a deep thinker, self-critical in a positive way, in a productive way, then you likely already have a lot of the traits and built-in self-checks that help to prevent the kinds of issues that I that my wife is worried about.

After our most recent conversation about this, I decided that I was going to do another pass of research focused on the ways that AI harms human cognition. If it does, to what degree, what is the science actually say about this? And what I found was that it depends. Go figure.

One study showed that depending on the prompt, AI was an excellent study tool for things like math, but could also cause a massive decrease in the skill of the users where they would overestimate their capabilities and then perform much more poorly on tests of the material. Another study showed that AI assistance for colonoscopies had a similar effect. Granted, these are slightly different use cases than what I assume the average person uses AI for LOL.

But that got me thinking even more over the next couple days. I began to integrate all of this research that I had uncovered into the way that my harness functions.

And then last night, as I was getting the shower, I had a sudden epiphany. I've always taught people, especially at work, about effective ways to use AI, especially when I was in the chat era of my journey. And one of the things that I've described is the concept of context poisoning, which is the idea that because these are basically just models and they just guess whatever input you provide will inevitably affect the output.

So, sure, duh. But you're not the only one giving input to an AI model. There's also the system prompt. There's also the built-in skills. There's also whatever else is on the back end that we don't know about. Not to be conspiratorial or anything. And more importantly, there's the training data. There are so many ways that context can be affected, and therefore the output.

So it follows that you need to be careful about what you put into an AI system because it will affect the output in ways that may drive your decision making. It may point you towards solution A over solution B, or it may never even tell you about solution B, depending on how you asked. Additionally, if you weren't aware of solution B, then you've effectively cheated yourself unwittingly out of the knowledge of a thing.

Now I realize that that's always a possibility, but one of the best things that I think AI does for us is allow us to more easily find the unknown unknowns. So oftentimes I will give it a very vague prompt or question, but with a prompt around it that instructs it to search widely into things that might not even necessarily be related so that I can get that information and judge for myself because, as we all know, these models are not to be trusted.

Now, that led to another thought going back to what my wife and her concerns and the research around them were since these statistical models are built off of human statements, human thoughts, human words. They are using or guessing into using human methods. And if we can poison their context window, then it follows that they could probably poison the human context window. You yet another bout of research. Turns out this is a thing that has been studied, and there is precedent for it I need to go look at the research for this part

That is what prompted me to attempt to create an admittedly ham-fisted solution. My thinking is if the AI can no longer provide you with anything other than what you've specifically asked for, then maybe that will limit the amount of influence it has on the human decision-making context.

Now, I'll tell you, I'm writing, or rather, dictating, this article to a Claude Astra eye session in VS Code using handy and I can tell you right now from personal experience, keep in mind this is the first time that I've used null mode for anything real since I created it yesterday. That it absolutely forces you to actually think through everything you're doing.

And yes, I know a few synthetic tests and some anecdotal evidence and a few carefully selected research papers or studies or retrospectives. Do not turn this into accepted theory.

So that's why I published it publicly and bothered to write this article and post it on every social service that I have the stomach to use x.com can kiss my ass

I'm hoping that this gets out there widely enough to maybe give me some additional data points, but also hopefully to encourage more people to take the time to think and reason through things that they should care about.

I'll link all of the studies and probably my research summaries near the end of this article. So you can go read them for yourself and give Null a try. I'm very interested in whether it makes any sort of difference at all 
