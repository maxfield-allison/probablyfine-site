---
title: "Hello from the basement"
description: "Why this blog exists, what it runs on, and what to expect: architecture deep-dives, incident write-ups, and honest notes on AI-assisted engineering."
date: 2026-07-28
tags: ["homelab", "meta"]
aiRole: drafted
---

Welcome to ProbablyFine, a blog about running real infrastructure at home, breaking it
in interesting ways, and writing down what I learned.

## What this is

I run a production-grade Kubernetes cluster in my basement: nine Talos Linux nodes, GitOps
via ArgoCD, Ceph storage, GPU scheduling across three different NVIDIA architectures, and a
firewall doing BGP for health-checked service VIPs. It's over-engineered on purpose. The
whole point is to practice the patterns real platform teams use, at a scale where I own
every layer and every outage is mine to fix.

This blog is where the interesting parts get written down.

## What to expect

- Architecture write-ups: how the cluster is put together and *why*, including the
  trade-offs that don't make it into the diagrams.
- Incident post-mortems: the honest version, where a "healthy" service was quietly
  broken for two months and the fix was three faults deep.
- Tooling and opinion, including AI-assisted engineering, which I use heavily and
  refuse to be coy about.

## On AI-assisted engineering

Some of these posts, including this one, are written with an AI agent in the loop. That's
not vibe coding. I design the systems, make the technology calls, review the output, and
own the debugging judgment; the agent helps me implement faster than I could by hand. Posts
written that way carry a tag saying so, and a note at the bottom saying what the machine
actually did. Owning that openly is the point.

It's probably fine. Let's find out.

---

**How this one was made.** This was the first post and it went up the same day as the site, in the same commit as the scaffolding that renders it. The draft was written from a description of what I wanted the blog to be, and I edited it.

It's also the post that's aged worst. It shipped with em dashes and a tidy bolded-list construction that I now treat as machine tells, and both got swept out eleven days later. The rulebook I check drafts against didn't exist when this went up, and part of the reason it exists is what this one read like.
