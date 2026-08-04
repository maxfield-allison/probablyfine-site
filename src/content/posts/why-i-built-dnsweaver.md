---
title: "I built dnsweaver because I was tired of managing DNS by hand"
description: "Automatic DNS for Docker, Kubernetes, and Proxmox, aimed at the self-hosted resolvers ExternalDNS skips. Every new container meant a hand-made record, and every dead one rotted in the zone. So I wrote dnsweaver, and then strangers started writing about it."
date: 2026-08-04
tags: ["dnsweaver", "dns", "homelab", "go"]
aiAssisted: true
draft: true
---

Spinning up a new container or VM and then manually creating its DNS record is one of those
small annoyances I never stopped hating. Worse than the creating is the forgetting: you tear
the thing down months later and its record just sits there, rotting in the zone, pointing at
nothing. Multiply that by a homelab's worth of churn and you've got a DNS zone that's half
lies.

So I built a tool to kill the annoyance. It's called dnsweaver, and the short version is: put a label on
a workload, get the DNS record automatically, remove the workload, the record goes with it.
The way I pitch it to other homelabbers is external-dns for the homelab: same pattern, aimed at
the half of the problem the Kubernetes-shaped tools skip. The part I'm proudest of is further
down, the Proxmox source, where the two design decisions I'd defend to anyone live.

It didn't start this general. The first version was a narrow thing called technitium-companion:
Technitium only, Traefik only, A records only. It solved my exact setup and nothing else. Then
I found out someone had already shipped a tool with almost the same name, and instead of just
renaming mine I took it as the push to rebuild it the way it should have been from the start,
many providers and many sources instead of one of each. This rewrite is dnsweaver, and most of
the design opinions below come from that second pass, not the first.

The label is the whole interface. If you already run Traefik, you already have the label it
needs:

```yaml
services:
  app:
    image: my/app
    labels:
      - "traefik.http.routers.app.rule=Host(`app.example.com`)"
      # dnsweaver sees that Host() rule and creates app.example.com.
      # No Traefik? Use the native label instead:
      # - "dnsweaver.hostname=app.example.com"
```

Start the container and the record appears. Remove it and the record is cleaned up. Set and forget.

## Why not just use ExternalDNS

The obvious question, and I asked it too. ExternalDNS is the standard answer for
automatic DNS in Kubernetes, and it's good at what it does. It reads a long list of sources,
Ingress, Service, Gateway API, Traefik and other CRDs, and it interfaces with a lot of providers. Two
things about its design didn't fit my problems, though.

It's strictly Kubernetes. It reconciles Kubernetes objects, so workloads that aren't in a cluster
aren't in scope.

And its center of gravity is public authoritative DNS. It can talk to self-hosted resolvers,
RFC 2136 support and a few others are in there, but the internal, self-hosted side seemed like a secondary path
rather than the main event.

My core problem was that secondary path. I run internal DNS on Technitium. My records
aren't all public, and my workloads aren't all in Kubernetes, they're in Docker, on Proxmox,
etc. When I looked, there wasn't much serving that side as a first-class concern. Plenty
for public DNS in K8s, almost nothing built around internal resolvers like Pi-hole, Bind,
PowerDNS, AdGuard, or Technitium, or for the Unbound resolver a lot of us just run on OPNsense
or pfSense, across mixed platforms.

That gap is the whole reason dnsweaver exists. Internal and external, for more than just
Kubernetes.

## Split-horizon is the point

The feature I care about is split-horizon: internal and external records from a
single label. One Traefik label on one workload produces both the internal record that
resolves on my LAN and the public record that resolves on the internet, with no duplication
and no second config to keep in sync. You can approximate this with two ExternalDNS instances
pointed at different providers, but you're then maintaining two deployments and two sets of
annotations for what is really one intent. dnsweaver does it from one label, once.

Under the hood it pushes to a pile of backends in parallel. Technitium, Cloudflare, Pi-hole,
AdGuard Home, dnsmasq, PowerDNS, RFC 2136, OVHcloud, the Unbound resolver on OPNsense and
pfSense, and a generic webhook, with more added over time. It runs across Docker, Docker Swarm,
Kubernetes, Proxmox, and Incus. It's written in Go, MIT licensed, ships Prometheus metrics and
a Helm chart. Standard homelab-tool checklist.

## The other reason: killing the wildcard

There was also a second motivation. I was tired of managing DNS records, and I was tired of the
wildcard cert.

When creating a record and a cert for every service is manual and annoying, you do what
everyone does. You issue one wildcard cert for `*.home.lab` and point everything
at it. It works fine until you think about what that one key can do. Leak it and every service
behind it is compromised at once. It also makes mutual TLS awkward, because mTLS wants each
service presenting its own identity, and a shared wildcard has no identity to present.

Once dnsweaver gives every service a real record automatically, the wildcard stops earning
its keep. A per-service certificate from my internal CA becomes the easy path. cert-manager
handles the ACME DNS-01 challenge against a zone dnsweaver already manages, and every service
ends up with its own cert and its own blast radius. That turns into the groundwork for
mTLS between services later, where a shared wildcard would get in the way.

dnsweaver never touches the certificates. It eliminated the reason I was leaning on a wildcard to
avoid dealing with them.

## The Proxmox source is where the opinions live

Here's the section I teased up top. Two decisions in the Proxmox integration, and the reasoning
behind each.

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

Proxmox VM IPs come from the QEMU guest agent, and the guest agent can be flaky. A VM mid-reboot,
or a node under load, returns nothing for a poll or two. If you take that literally, you delete
the record the moment the agent hiccups and recreate it when it recovers, so every transient
blip flaps the record.

The solution I went with is a cache with a TTL of three times the poll interval. A missed poll or two just
serves the last good IP, and the record only changes when something real changes. The
full resolution order stops at the first thing that works: read the IP from the LXC's network
config, or ask the QEMU guest agent, or fall back to the cached value if it's still fresh, and
if none of that works, log it and skip that workload instead of failing the whole run.

One more thing the guest-agent path deliberately does not do: trust the OS hostname. It's often
different from what you named the VM in Proxmox and it's unreliable, so the Proxmox name or an
explicit tag wins instead.

### Both rules run through the whole tool

Neither of these is really about Proxmox. They're two of the core rules the whole thing is designed around.

The first is don't do damage you can't justify. You declare what you want managed, and it fails
closed when you haven't. Every record dnsweaver creates gets a TXT ownership marker, so it will
never delete a record a human made by hand. When it isn't sure, it does nothing.

The second is prefer durable truth over a momentary signal. The name you set beats the name the
OS reports. The last known-good IP beats a blank answer from an agent that's mid-reboot. A
backend that's briefly unreachable gets logged and skipped, not allowed to take the whole run
down with it.

Both come from the same place: a DNS tool that's confidently wrong is worse than one that's
briefly behind. Everything else in dnsweaver is a variation on those two.

## Then people started writing about it, and contributing to it

The thing that surprised me was that I built this thing to scratch my own itch, and then it picked up
real users. Two independent write-ups showed up that I had nothing to do with, both within a
couple weeks of each other. [Korben](https://korben.info/en/dnsweaver-automatic-dns-docker-proxmox-k8s.html)
ran an enthusiastic walk through the core magic, a container starts with a Traefik label and
the record appears, you remove it and it's gone, with the split-horizon `bitwarden` example
and a cheerful "not in prod right away though." [Tech2Geek](https://www.tech2geek.net/dnsweaver-automatically-manages-dns-for-docker-kubernetes-and-proxmox/)
wrote the more structured version, worked through split-horizon, the multi-backend sync, and
the metrics, and put dnsweaver next to ExternalDNS in a feature table. Both noted it's new and
single-maintainer, both said worth trying but cautious before production. Fair on every count.

The better surprise was contribution. The Incus crowd is small but sharp, and René Jochum, who
maintains [incus-compose](https://github.com/lxc/incus-compose), showed up and got involved
properly. He opened an issue asking dnsweaver to understand the labels his tool writes, reviewed
the implementation, and pointed out a scaled-services case I'd missed that turned into its own
tracked feature. He also sent a code fix directly, and his bug report with repro is the
reason dnsweaver now does Incus certificate pinning and trust-token enrollment instead of the
weaker default. A chunk of dnsweaver's Incus support exists because the person who'd know best
cared enough to push on it.

Watching that happen was fun. You write a thing for yourself, and at some point it
stops being only yours.

If you want to poke at it, the code is on [GitHub](https://github.com/maxfield-allison/dnsweaver)
and there's a [docs site](https://maxfield-allison.github.io/dnsweaver/) with a Helm chart and a
provider for whatever resolver you're running. It's still a single-maintainer project, so the
coverage's "cautious before prod" note is the right one. If you try it, the most useful thing
you can do is open an issue, especially to tell me which backend you're missing. That's how the
provider list has grown.

If you've ever manually created a DNS record and then forgotten to delete it, or migrated 50+
services to a new domain, you already know why it exists.

It's always DNS. Even when it isn't, it's DNS. dnsweaver won't change that. What it does is keep
your records honest, so when the finger-pointing starts, yours are

Probably fine.
