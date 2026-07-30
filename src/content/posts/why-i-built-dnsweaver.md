---
title: "I built a DNS tool because I was tired of doing it by hand"
description: "Every new container or VM meant hand-creating a DNS record, and forgetting to delete it later meant stale records rotting in the zone. ExternalDNS didn't cover my case. So I wrote dnsweaver, and then strangers started writing about it."
date: 2026-07-30
tags: ["dnsweaver", "dns", "homelab", "go"]
aiAssisted: true
draft: true
---

Spinning up a new container or VM and then manually creating its DNS record is one of those
small annoyances I never stopped hating. Worse than the creating is the forgetting: you tear
the thing down months later and its record just sits there, rotting in the zone, pointing at
nothing. Multiply that by a homelab's worth of churn and you've got a DNS zone that's half
lies.

So I built a tool to kill it. It's called dnsweaver, and the short version is: put a label on
a workload, get the DNS record automatically, remove the workload, the record goes with it.

## Why not just use ExternalDNS

That's the obvious question, and I asked it too. ExternalDNS is the standard answer for
automatic DNS in Kubernetes, and it's good at what it does. But what it does is a specific
slice of the problem:

It targets public authoritative DNS. Route 53, Cloudflare, the big providers. It's built
around external records.

And it's Kubernetes-only. It reads Ingress and Service objects and nothing else.

My problem was the other half. I run internal DNS on Technitium. My records aren't all public,
and my workloads aren't all in Kubernetes, they're in Docker, on Proxmox, wherever. When I
looked, there wasn't much serving that side. Plenty for public DNS in K8s, almost nothing for
internal resolvers like Pi-hole, Bind, PowerDNS, AdGuard, or Technitium across mixed platforms.

That gap is the whole reason dnsweaver exists. Internal and external, from more than just
Kubernetes.

## Split-horizon is the point

The feature I care about is split-horizon: internal and external records from a
single label. One Traefik label on one workload produces both the internal record that
resolves on my LAN and the public record that resolves on the internet, with no duplication
and no second config to keep in sync. ExternalDNS can't structurally do that, because it only
knows about the public half.

Under the hood it pushes to a pile of backends in parallel. Technitium, Cloudflare, Pi-hole,
AdGuard Home, dnsmasq, RFC 2136, PowerDNS, OVHcloud, and a generic webhook, with more added
over time. It runs across Docker, Docker Swarm, Kubernetes, Proxmox, and Incus. It's written
in Go, MIT licensed, ships Prometheus metrics and a Helm chart. Standard homelab-tool checklist.

## The Proxmox source is where the opinions live

The part I'm proudest of isn't the feature list, it's two design decisions in the Proxmox
integration that I'd defend to anyone.

### "All VMs" is not a safe default

dnsweaver will not manage DNS for every Proxmox workload by default. You have to opt in,
either by tagging the VMs and LXCs you want, or by explicitly setting a flag that says "yes,
really, all of them." If you set neither, it refuses to start.

That's on purpose. Homelabs are messy. You accumulate Windows test boxes you spun up for one
afternoon, half-finished VMs, old templates, a clone you forgot about. Auto-publishing every
one of those into DNS is how your zone fills up with garbage that resolves to machines that
barely exist. Making the operator name what's real is the safer default, even though it's the
less convenient one. Fail closed.

### The cache exists to absorb flapping

Proxmox VM IPs come from the QEMU guest agent, and the guest agent is flaky. A VM mid-reboot,
or a node under load, returns nothing for a poll or two. If you take that literally, you delete
the record the moment the agent hiccups and recreate it when it recovers, so every transient
blip flaps the record.

The fix is a cache with a TTL of three times the poll interval. A missed poll or two just
serves the last good IP, and the record only changes when something real changes. The
full resolution order stops at the first thing that works: read the IP from the LXC's network
config, or ask the QEMU guest agent, or fall back to the cached value if it's still fresh, and
if none of that works, log it and skip that workload instead of failing the whole run.

One more thing the guest-agent path deliberately does not do: trust the OS hostname. It's often
different from what you named the VM in Proxmox and it's unreliable, so the Proxmox name or an
explicit tag wins instead.

## Then strangers started writing about it

The part that surprised me: I started it to scratch my own itch, and it picked up
real users. Two independent write-ups showed up that I had nothing to do with, both within a
couple weeks of each other. One was an enthusiastic informal piece walking through the core
magic, a container starts with a Traefik label and the record appears, you remove the container
and it vanishes. The other was a more structured review that worked through the problem space,
split-horizon, the multi-backend sync, and the built-in metrics. Both framed it against
ExternalDNS, both noted it's new and single-maintainer, both said worth trying but be careful
before production. Fair on all counts.

Watching that happen was the fun part. You write a thing for yourself, and at some point it
stops being only yours.

dnsweaver is open source if you want to poke at it. It's still a single-maintainer project, so
the coverage's "cautious before prod" note is the right one. But if you've ever hand-created a
DNS record and then forgotten to delete it, you already know why it exists.

It's probably fine.
