---
title: "Hello from the basement"
description: "Why this blog exists, what it runs on, and what to expect: architecture deep-dives, incident write-ups, and honest notes on AI-assisted engineering."
date: 2026-07-28
tags: ["homelab", "meta"]
aiAssisted: true
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
written that way are tagged `ai-assisted`. Owning that openly is the point.

It's probably fine. Let's find out.
