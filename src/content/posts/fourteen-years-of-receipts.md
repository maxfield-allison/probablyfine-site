---
title: "Fourteen years of receipts"
description: "I pulled my data out of every service I've used since 2011 for a different project, and somewhere in the middle of it I found out what this hobby has cost me. The money was the easy part to count. Steam counted the other thing."
date: 2026-08-25
tags: ["homelab", "hardware", "retrospective"]
aiRole: drafted
draft: true
---

I've been pulling my data out of everything.

I started grabbing it for a different project. Every service I've touched since about 2011 is holding a file on me, and I wanted to see what was in it before I decided how I felt about it. Google, Amazon, Steam, all of them. That's its own post and I'll write it when I've finished compiling the exports and putting together the full picture.

Somewhere in the middle of it I realized I had fourteen years of Amazon order history sitting in a CSV, and on a whim, since I had the data anyway, I went looking for the total.

1,860 orders since 2012. 456 of them are computer related which added up to...

**$38,743.69.**

Which is, and I want to be precise about this, a lot of fucking money.

About $2,767 a year. I posted about it on Facebook a couple weeks ago and my wife chimed in, "Only $2300 a year lol." Then, a minute later, "Still cheaper than the 'zoo'." We have a lot of animals. Dividing by fourteen does help make a five-figure number feel a little more tolerable.

Her number and mine are different because mine depends on what you're willing to call a homelab. Cables, adapters, monitors and KVMs in, and it's $38,743. Out, and it's $30,971. Drop the cameras and smart plugs too and you're at $27,500. I'm sticking with the big one, because I bought all of it for the same reason and I'm not going to route around the fact that it was all in service of one thing in my mind.

All three are floors regardless. The export only knows about Amazon. Nothing from eBay, which is where most of the used enterprise gear came from. Nothing from drives bought in a store and shucked to feed the server. Nothing gifted. The switch the entire network runs on was about $150 on eBay and does not appear in that file anywhere.

Biggest year was 2022 at $10,719. That was [the rack](/blog/a-tour-of-the-rack).

## I kept digging

Steam has an export too, and it's a slightly more interesting one, because Steam hands over something Amazon won't.

Not that Amazon doesn't have it. They know how long I looked at a thing before I bought it, what I hovered over and abandoned, which photo I stopped scrolling on. None of that is in the export. What you get when you ask a company for your data is the record of your transactions with them, not the record they keep on you, and those are very different files. Steam is the rare case where they're close to the same thing.

$13,072 since 2014, across 439 purchases. Roughly a thousand a year, about a third of what the homelab runs at, and in twelve years not once did I question whether it was worth it.

Then the number I wasn't looking for popped out at me. Across 288 games with playtime recorded: **15,399 hours.**

A year and nine months. Continuous. And that's only Steam, which didn't exist for most of the time I've been doing this. It has no idea about RuneScape in middle school, or the Halo co-op on Russ's Xbox next door. It definitely doesn't know about the stretch where I'd sneak downstairs at night to play Unreal Tournament on my dad's Mac until four in the morning, then sleep through first and second period. Floor again.

So I can tell you how long I have spent playing video games to one decimal place. Steam stored it for twelve years and will render it on a page sorted by hours descending, in case I ever want to feel something about it.

But I have no idea how long I've spent on the homelab.

Nothing counted it. There's no session timer on racking a server, no playtime tracker for the third rebuild of a cluster you already rebuilt twice because the second time taught you why the first time was wrong. The receipts and invoices tell me the exact second and exactly how much money left my account and nothing whatsoever about the days and nights that followed, breaking, fixing, and learning.

## Where it got me

My mom asked, in the same thread, whether any of it earned me anything. Whether it moved me up at work, and whether it might have paid for itself.

I think the answer is a resounding "Yes".

I flashed a consumer router with Tomato because I wanted a couple of SSIDs, and it made me learn VLANs and subnets and addressing to get there. I ran Plex for my friends and picked up Linux properly holding it together. I got to Ceph the long way, after ZFS and Gluster spent a couple of years teaching me why I didn't want ZFS and Gluster. Kubernetes went up on nine nodes in my basement well before anybody was going to ask me about it professionally. [The whole arc is its own post](/blog/how-the-lab-got-here).

Every one of those was a thing I wanted at home first and a thing I got paid for second, in that order, no exceptions.

So the money is settled. At least $38,743 over fourteen years to build the career I have is not a hard trade, and I'd take it again, no questions asked.

Run it against the obvious comparison. Four years of tuition and fees at an in-state public university runs about $46,400 at current rates, and that is the number before anyone eats or sleeps indoors. Add housing and food and the four-year total is closer to $120,000. Fourteen years of my hobby came in under the tuition line by itself.

## Pricing the hours

The hours have no counter, but that is not the same as being unknowable, and I got lazy about that the first time I wrote this down.

My first instinct was to scale it. Games took a third of the money, so maybe games took a third of the time, which would put the homelab somewhere around 46,000 hours. That is nine hours a day, every day, for fourteen years. I like this hobby. I do not like it nine hours a day.

Go at it from the other end instead. Fourteen years is about 5,100 days. Three hours a day, every day, no weeks off, gets you to roughly 15,300 hours, which lands within a rounding error of what Steam says I spent on games. Three hours a day sounds absurd until you think about what a Tuesday actually looked like for most of those years, and then it sounds low for any week with a project running.

So call it fifteen thousand hours and put a price on them. Twenty-five dollars an hour is less than I would accept to do this for somebody else, and it still comes to **$375,000**. Roughly ten times what the hardware cost, for a hobby I have spent this entire post describing as cheap.

That is a real number and I stand behind the arithmetic. It is also answering a question I do not actually have.

Pricing the hours assumes I spent them to get something, and some of them I did. But I would do this if it paid nothing and led nowhere. I have turned down a night of gaming for a lab project more times than I can count, and a lab project can mean standing up AI services on my own cluster, or building a self-hosted replacement for the entire Google suite, or writing this.

Steam counted 15,399 hours of the hobby I would give up first.
