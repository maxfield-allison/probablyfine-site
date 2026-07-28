---
title: "How the lab got here"
description: "The homelab started as a $75 school-surplus desktop and a router I had no business flashing. Seven years later it's a nine-node Kubernetes cluster. This is the arc, evolution by evolution, scar by scar."
date: 2026-07-28
tags: ["homelab", "history", "retrospective"]
aiAssisted: true
draft: true
---

Every homelab has an origin story, and most of them start dumber than the current setup
makes them look. Mine started with a $75 desktop and a router I had no business flashing.

## The $75 firewall

The first real piece was a firewall. I bought a slim HP desktop, one of those little
corporate G2 boxes, from a local school that was clearing them out. Seventy-five dollars. I
dropped a four-port gigabit NIC into it and turned it into an OPNsense box, then flashed my
consumer router with Tomato so I could actually run VLANs and a few SSIDs behind it.

That box taught me the parts nobody enjoys learning: VLANs, addressing, subnets, the gap
between "it works" and "it works the way I meant it to." None of it was theoretical. Get the
addressing wrong and the internet stops for the whole house, and you hear about it
immediately.

This was also around the time I was clawing out of restaurant work. I'd been a line cook and
a server, and IT was the thing I'd actually wanted the whole time. The A+ came a couple years
later. The firewall came first, which in hindsight is the right order. I broke my own network
before anyone paid me to touch theirs.

## The whitebox

Once I trusted the network I built a real server, a whitebox running Linux Mint, around 2017.
That's where it turned into an actual lab.

I got into Plex and the whole \*arr stack, mostly to get out from under streaming services
that kept splitting the same catalog across more subscriptions every year. Then I stood up
Docker, and it got out of hand fast. Thirty-ish services almost immediately. That's also when
I found the homelab community and GitHub, which is roughly like handing a pyromaniac a lighter
and a grant.

A few things defined that era. Friends got in. I handed out Plex access and put Ombi in front
of it so people could make their own requests and let the automation sort out the rest. It
grew into a donation-only Plex service with around thirty users, and I added a GPU
specifically to handle hardware transcoding once that many people were watching at once.
Storage kept sprawling too. I bolted drives onto that box until it physically could not hold
another one, which is what pushed me toward "unlimited" cloud storage. I landed on Google
Workspace, and by the time I finally clawed back out of it I had something like 127 TB parked
in their cloud. That is a whole story on its own, and it gets its own post.

Around 2018 and 2019 I started taking home automation seriously. A growing pile of IoT junk,
Z-Wave bridged into MQTT, and the slow realization that a smart home is just a distributed
system living in your walls that occasionally refuses to turn on a light.

## The machine that refused to die

In 2019 I built a Threadripper workstation. An ASRock Fatal1ty X399 Professional Gaming board,
a Threadripper 1900X, a Noctua cooler roughly the size of a small animal, and a GTX 1080 Ti.

I bring it up because that exact motherboard is still running today. It survived every
evolution that came after it and turned into pve-01 in the current cluster. The CPU got
swapped up to a 2920X, the memory went to 128 GB, and it collected enterprise network cards
along the way, but it is the same board I built on a desk in 2019. The 1080 Ti is still in it
too, now passed through to a Kubernetes GPU worker. Seven years of continuous service across
three completely different architectures. Not bad for a gaming board.

## Why cluster at all

The honest reason I ever moved past one box: other people depended on it.

When it is just you, a server falling over is a personal annoyance. Once your friends are
streaming from it and your house's lights and locks and thermostats run through it, an outage
is a support ticket, and you are the only person on call. I wanted fault tolerance because I
was tired of being the single point of failure. That one requirement drove every jump that
came after.

## Proxmox and the rack

The move off the single box started by not throwing it away. I migrated the Linux Mint disk
image straight into a Proxmox VM. The old whitebox got to keep living, just virtualized, and
from there I started building out.

By late 2020 I was running a few HP mini PCs as light nodes. In February 2021 I built the
first real rack and got everything off the shelf it had been living on. From there it was
Proxmox, one node at first, then a couple, running Plex and a steadily growing Docker stack
and the home automation. That setup carried the lab for a few years without much drama, which
in this hobby counts as a golden age.

## The pivot: Ceph and Swarm

The big jump happened fast, and recently. By late 2025 the lab had turned into a five-node
Proxmox cluster with real hardware behind it. pve-00 is an EPYC 7282 with 256 GB of ECC in a
4U hot-swap chassis. pve-01 is that Threadripper. Three repurposed HP small-form-factor boxes
fill out quorum and soak up whatever is left. Underneath all of it is a Ceph cluster, around
232 TiB raw across a pile of spinning disks, NVMe, and a couple of Intel Optane drives for
metadata.

Storage is also where I collected most of my scars.

Before Ceph I ran ZFS on each node with GlusterFS as the shared layer, and Gluster and I have
history. Split-brains. Corrupted shards I would have to track down by hand, repair, and then
wait on, because distributed storage repair runs on its own schedule and does not care about
yours. Migrating off ZFS-and-Gluster onto Ceph was its own multi-week saga, usually kicked off
by an otherwise routine Proxmox upgrade deciding to get interesting at 3am.

A couple of lessons from that era are permanent. Backups are not optional, and "I have
backups" is not the same sentence as "I have tested restores." I learned the difference the
way everyone does. And SQLite on a network filesystem is a trap. I tried running service
databases as SQLite files on Gluster, and network shares and SQLite get along about as well as
you would expect, which is to say not at all. More than once the fix was literal database
surgery, or reaching for open-source tools like the Plex dbrepair script, which I ended up
sending fixes back to.

Orchestration in this era was Docker Swarm, and by the end it was running close to a hundred
containers. Swarm carried the lab a long way. But at that scale I kept hitting the walls the
internet had warned me about. Routing that still pointed at containers that had already moved,
and recovery that was slower and less predictable than I could live with when real people were
on the other end of it.

## Kubernetes

When Swarm started showing its limits, Kubernetes was the obvious next step. Obvious and
genuinely daunting, which is why most people circle it for a while before committing. It is a
real jump in complexity. But the failure modes I was fighting were the exact ones Kubernetes
is built to handle, so eventually I stopped circling.

Where it sits now: nine Talos Linux nodes, GitOps through ArgoCD, Ceph underneath, and GPU
workloads spread across three different NVIDIA generations. The migration was also my chance
to do the separation I had always wanted and never had the runway for. Dedicated tiers for
authentication, for databases, for GitLab and CI, plus a security and honeypot layer to
actually watch what is happening on the network.

This is also the first evolution I did with an AI agent in the loop, and that is not a
footnote. Having an AI pair in the editor let me move through the migration service by service
in a fraction of the evenings it would have taken by hand, while raising the bar on the design
instead of just lifting and shifting the old one. I make the calls and own the debugging
judgment. The agent helps me implement faster. Posts I write that way get tagged ai-assisted,
and I am not going to be cagey about it.

## What it was always for

Strip off the rack and the specs and the acronyms and the reason has not changed. I do this
because building it and understanding it is fun, and because the automation pays me back every
day. The lights come on before I am awake. The media shows up. The services my friends use
mostly stay up. And the lessons have a way of turning up in the day job whether I planned for
them or not.

I skipped a lot here. The Google Workspace exodus, the specific outages, the hardware itself.
Those get their own posts. There is even an old Linux Mint image floating around somewhere
that I might boot up just to see what Docker looked like back when this whole thing was one
node and a bad idea.

For now, that is the arc. A $75 firewall to a Kubernetes cluster, one evolution at a time.

It's probably fine.
