---
title: "How installing a GPU took down my storage cluster"
description: "I put a graphics card in a Proxmox node and it quietly knocked NVMe drives off the bus, killed Ceph OSDs, and left every VM hanging at the bootloader. Nobody warns you that a GPU can do that. Here's the whole incident, including the parts I got wrong."
date: 2026-07-30
tags: ["homelab", "ceph", "incident", "proxmox"]
aiAssisted: true
draft: true
---

I lost three OSDs, watched every VM hang at GRUB, and spent a night convinced I'd
destroyed part of my Ceph cluster. The cause was a graphics card. I had installed an RTX
4070 Ti into one of my Proxmox nodes and rebooted, the way you install any PCIe card, and
that single change set off a chain of failures that took me a while to even connect back
to the GPU.

This is the whole thing, including the two hypotheses I chased that were wrong, because the
wrong turns are the actual lesson.

## The setup

Five-node Proxmox cluster, Ceph underneath, 32 OSDs across a mix of NVMe. The pools run
size=3, min_size=2, which matters a lot later. A couple of the OSDs lived on Samsung 980 PRO
drives mounted on a PCIe bifurcation carrier card, the kind that splits one x16 slot into
four x4 NVMe slots. Remember the carrier. It is the whole story.

I dropped a 4070 Ti into the flagship node and rebooted. Everything looked fine for a bit.
Then OSDs started going down.

## First I blamed a missing keyring

The first symptom was boring: two OSDs down. So I did the boring thing and restarted them
and read the journal. One of them said this:

```
auth: unable to find a keyring on /var/lib/ceph/osd/ceph-8/keyring:
(2) No such file or directory
```

Missing keyring after a reboot. That has an obvious fix: pull the key back out of Ceph auth,
fix the permissions, start the OSD.

```bash
ceph auth get osd.8 -o /var/lib/ceph/osd/ceph-8/keyring
chown ceph:ceph /var/lib/ceph/osd/ceph-8/keyring
chmod 600 /var/lib/ceph/osd/ceph-8/keyring
systemctl start ceph-osd@8
```

This was wrong. Not the commands, the diagnosis. The missing keyring was a symptom, not the
disease. This is the trap you fall into every time: the first fix you reach for is the one
that would make sense on a healthy system, and you are not on a healthy system. You are on
whatever the incident has turned it into.

## systemd hid the real error from me

The restart attempts tripped systemd's start-rate limiter, which then masked the actual
failure behind "start request repeated too quickly." So the next step wasn't a fix, it was
getting systemd out of the way so I could see the truth:

```bash
systemctl reset-failed ceph-osd@8.service
systemctl start ceph-osd@8.service
journalctl -u ceph-osd@8.service -n 50 --no-pager
```

And there it was:

```
missing 'type' file and unable to infer osd type
```

The OSD directory had only the keyring in it. The `type` file, the `fsid`, the `block`
symlink that points at the actual storage, all gone. `ceph-volume lvm list` didn't even
list the OSD anymore. At that point I thought the OSDs had been destroyed during the reboot,
which was closer but still not right.

## The drive was just gone

The reason the `block` symlink was dead is that the thing it pointed at no longer existed.
One of the 980 PROs still showed up but as a different device. The other one was not on the
system at all. Not degraded, not erroring. Absent.

That's when the carrier card clicked. Those drives were on the PCIe bifurcation card. And I
had just changed the PCIe layout of the entire machine by adding a GPU.

The confirming detail, once I looked for it, is clean enough that it should be the first
thing you check in a situation like this:

The drive showed up in `lspci` but not in `nvme list`.

That split is the fingerprint. The device is physically present and the PCIe bus sees it,
but it never enumerated as an NVMe namespace, which means the operating system has no block
device to hand to Ceph. That is not a dead drive. That is a bifurcation problem. Adding the
GPU re-shuffled how the board allocated PCIe lanes, the carrier card stopped getting the
`x4x4x4x4` split it needed, and its drives fell off the bus. The fix is in firmware, not in
Ceph:

```bash
# nudge the bus
echo 1 > /sys/bus/pci/rescan

# the real fix: BIOS -> PCIe config -> set the slot back to x4x4x4x4
# then a full power cycle, not just a reboot
```

## Meanwhile, a completely different OSD was actually corrupt

While I was untangling the bifurcation problem, a third OSD on a different node was in a
genuine crash loop, and this one had nothing to do with the GPU. It just picked the worst
possible night to die.

```
ceph-osd@27.service: Main process exited, code=killed, status=6/ABRT
ceph-osd@27.service: Start request repeated too quickly
failed to start osd.27
```

I tried to repair it and got a wall of BlueStore assertion failures, `ceph_assert_fail`
inside `_open_db_and_around`, repeated aborts. That is BlueStore's internal database being
corrupt, and it is not something you talk your way out of. That OSD was gone. The move there
is to stop trying to save it and purge it cleanly so the cluster can rebalance around it.

So now I had three distinct failures tangled into one incident: a bifurcation problem, a
drive that had physically vanished, and a real BlueStore corruption. Part of what made the
night long was that they all looked like "OSD down" at the top and only separated once I dug
into each one.

## The scary part was a lie

Here is the moment the whole thing felt catastrophic. I couldn't start VMs. They would get
to GRUB and hang there. When storage is falling apart and your VMs won't boot, your brain
goes straight to "the data is gone."

The data was not gone. The VMs were hanging because the cluster was rebalancing, and
rebalance traffic plus a bit of clock skew had made disk reads slow enough that bootloaders
and kernels were just sitting there waiting on I/O. It is the same feeling as trying to use
your laptop while it does a giant file copy in the background. Everything is technically
working and everything is unbearably slow.

That distinction, between "slow because it's healing" and "broken because data is lost," is
the difference between a bad night and a disaster, and from the outside they look identical.

## Did I lose any data?

I asked the question out loud, which is the honest version of every incident. The way you
answer it is not by feeling better, it's by checking for the two states that actually mean
loss:

```bash
ceph health detail
ceph pg dump | grep -i incomplete
ceph pg dump | grep -i unfound
ceph pg ls | grep -v "active+clean"
```

No `incomplete` PGs, no `unfound` objects. Everything else was `active+undersized+degraded`,
which sounds alarming and is not. It just means some placement groups were running on fewer
than their full three copies while the cluster rebuilt.

This is where size=3, min_size=2 earns its keep. Three copies of everything. Losing one OSD
out of 32 means every piece of data still has two other replicas alive. The cluster was never
in danger of loss from a single failed drive, it was only ever in danger of being slow while
it made a third copy again. Redundancy did exactly the boring thing it exists to do, and the
whole panic was really just me watching it work and misreading the symptoms.

## Making it usable while it healed

The one genuinely useful lever during all this: you can throttle Ceph recovery so it stops
starving your clients of I/O. Recovery will take longer, but your VMs will actually boot.

```bash
ceph tell osd.* config set osd_max_backfills 1
ceph tell osd.* config set osd_recovery_max_active 1
ceph tell osd.* config set osd_recovery_sleep_hdd 0.1
```

You are trading recovery speed for client latency on purpose. Once the VMs are happy and
you're not staring at a hung bootloader, you can turn the numbers back up and let it finish
faster.

## Confirming a drive was actually dead

The bifurcation drive came back once I fixed the lane allocation. The other 980 PRO did not.
I pulled both suspect drives, put them in a USB-to-NVMe adapter, and plugged them into a
completely different machine. One worked. The other was not recognized at all, on a different
computer, over a different interface. That is the cleanest possible proof that it is the drive
and not your config: it fails everywhere, independent of the system that was blamed for it.

So the final tally was one drive recovered by fixing firmware, one drive genuinely dead, and
one OSD purged for BlueStore corruption. Replacement drives were already on the way, and the
fix from there is unglamorous: add them back as new OSDs, one at a time so the rebalance load
spreads out.

## What I actually took away

The GPU is the villain in the headline, but the real lessons are smaller and more useful than
"graphics cards are dangerous."

Adding any PCIe card can re-shuffle bifurcation and knock other PCIe devices off the bus, and
the fingerprint of that is a device that shows in `lspci` but not in `nvme list`. If you run
NVMe on a bifurcation carrier, a GPU in the same box is not a neutral change.

The first fix you reach for is calibrated for a healthy system, and you are not on one. The
missing keyring looked like the problem and was three layers downstream of it.

And "slow" and "lost" look identical from the driver's seat. The only way to tell them apart
is to stop guessing and go check for incomplete PGs and unfound objects. Your storage layer
will tell you the truth if you ask it the right question instead of asking your gut.

The data was fine the whole time. size=3, min_size=2. That's the entire reason a dead drive
was an annoyance and not a catastrophe.

It's probably fine.
