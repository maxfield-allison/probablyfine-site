---
title: "How installing a GPU took down my storage cluster"
description: "I put a graphics card in a Proxmox node and afterward the NVMe drives on a bifurcation carrier wouldn't enumerate, which killed Ceph OSDs and left every VM hanging at the bootloader. Here's the whole incident, including the mechanism I got wrong."
date: 2026-08-04
tags: ["homelab", "ceph", "incident", "proxmox"]
aiAssisted: true
draft: true
---

I lost three OSDs, watched every VM hang at GRUB, and spent a night convinced I'd
destroyed part of my Ceph cluster. The cause was a graphics card. I had installed an RTX
4070 Ti into one of my Proxmox nodes and rebooted, the way you install any PCIe card, and
that one change set off a chain of failures that took me a while to even connect back
to the GPU.

This is the whole thing, including the two hypotheses I chased that were wrong.

## The setup

Five-node Proxmox cluster, Ceph underneath, 32 OSDs across a mix of NVMe and spinning disks. The pools run
size=3, min_size=2, which matters a lot later.

The node in question is the flagship: an ASRockRack ROMED8-2T with an EPYC 7282, 256 GB of ECC,
and a stack of NVMe, running Ceph Reef. A couple of the OSDs lived on Samsung 980 PRO drives
mounted on an ASUS Hyper M.2 X16 carrier, the kind that splits one x16 slot into four x4 NVMe
slots and needs the slot set to `x4x4x4x4` in BIOS to do it. Keep that carrier in mind...

I dropped a 4070 Ti into that node and rebooted. Everything looked fine for a bit.
Then OSDs started going down.

## First I blamed a missing keyring

The first symptom was boring: two OSDs down. So I did the boring thing and restarted them
and read the journal. One of them said this:

```
auth: unable to find a keyring on /var/lib/ceph/osd/ceph-8/keyring:
(2) No such file or directory
```

Missing keyring after a reboot. That's an obvious fix: pull the key back out of Ceph auth,
fix the permissions, start the OSD.

```bash
ceph auth get osd.8 -o /var/lib/ceph/osd/ceph-8/keyring
chown ceph:ceph /var/lib/ceph/osd/ceph-8/keyring
chmod 600 /var/lib/ceph/osd/ceph-8/keyring
systemctl start ceph-osd@8
```

This was wrong. The missing keyring was a symptom, not the disease. The first fix you reach
for is the one that makes sense on a healthy system, and I wasn't on a healthy system. I was
on whatever the reboot had turned it into.

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

The reason the `block` symlink was dead is that the thing it pointed at no longer existed. One
of the 980 PROs was still physically detected but the OS had no NVMe device for it. The other
wasn't on the system at all. Not degraded, not erroring. Absent.

That's when I remembered the carrier card. Those drives were on it, and the one thing I had
changed was adding a GPU and going into BIOS during the install.

The confirming detail, once I looked for it, is clean enough that it should be the first
thing you check in a situation like this:

The drive showed up in `lspci` but not in `nvme list`.

That split is the tell. The device is physically present and the PCIe bus sees it,
but it never enumerated as an NVMe namespace, which means the operating system has no block
device to hand to Ceph. And that, is a bifurcation problem.

Here's the part I want to be honest about, because it's the part I got wrong in my head first.
This board doesn't work the way a consumer board does. The ROMED8-2T hangs all seven x16 slots
directly off the EPYC socket's 128 lanes, each slot with its own dedicated 16. There's no
chipset in the path and no lane-sharing between slots, so dropping a GPU into an empty slot
**can't** steal or re-split the carrier's lanes. My first instinct ("the GPU stole the
bifurcation") is exactly the plausible-sounding thing that isn't true on this platform.

What was true: the slot's bifurcation setting was no longer `x4x4x4x4` when I got there, so the
carrier wasn't presenting four x4 links and the drives behind it never came up as NVMe devices.
Why it changed, I honestly can't prove. Either the firmware loaded defaults after the hardware
change (a rough first POST and memory retraining on EPYC can do that) or I bumped it myself
while I was in setup sorting out the display between the onboard BMC and the new card. I didn't
capture the BMC event log at the time, and by the time I thought to look, the logs had rotated.
So: the setting was wrong, and I can't tell you whether the board did it or I did. The fix was
in firmware either way, not in Ceph:

```bash
# nudge the bus
echo 1 > /sys/bus/pci/rescan

# the real fix: BIOS -> PCIe config -> set the slot back to x4x4x4x4
# then a full power cycle, not just a reboot
```

One more honest caveat: a big GPU also enlarges the MMIO/BAR map, and a device that can't get
BAR space shows up in `lspci` but never binds a driver, which produces the exact same
`lspci`-yes / `nvme list`-no symptom. I'm confident the bifurcation setting was the main event
because fixing it brought the drives back, but with the incident logs gone I won't pretend I
ruled the BAR angle out completely.

## Meanwhile, a different OSD was actually corrupt

While I was untangling the bifurcation problem, a third OSD on a different node was in a
genuine crash loop. This one had nothing to do with the GPU directly, but I doubt the timing
was a coincidence. Recovery load is what tends to find the next-weakest drive, and latent
BlueStore corruption usually surfaces right when backfill starts hammering it.

```
ceph-osd@27.service: Main process exited, code=killed, status=6/ABRT
ceph-osd@27.service: Start request repeated too quickly
failed to start osd.27
```

I tried to repair it and got a wall of BlueStore assertion failures, `ceph_assert_fail`
inside `_open_db_and_around`, repeated aborts. That's BlueStore's internal database being
corrupt, and it is not something you restart your way out of. That OSD was gone. The move
is to stop trying to save it and purge it cleanly so the cluster can rebalance around it.

So now I had three distinct failures tangled into one incident: a bifurcation problem, a
drive that had physically vanished, and a real BlueStore corruption. Part of what made the
night long was that they all looked like "OSD down" at the top and only separated once I dug
into each one.

## The scary part was a lie

The moment felt catastrophic. I couldn't start VMs. They would get
to GRUB and hang there. When storage is falling apart and your VMs won't boot, your brain
goes straight to "the data is gone."

The data was not gone. The VMs were hanging because the cluster was rebalancing, and the
recovery traffic had made disk reads slow enough that bootloaders and kernels were just
sitting there waiting on I/O. It's the same feeling as trying to use your laptop while it does
a giant file copy in the background. Everything is technically working but also unbearably slow.

From the outside, "slow because it's healing" and "broken because data is lost" look
identical. That's the whole trap.

## Did I lose any data?

I asked the question out loud, checking for the two states that mean
loss:

```bash
ceph health detail
ceph pg dump | grep -i incomplete
ceph pg dump | grep -i unfound
ceph pg ls | grep -v "active+clean"
```

No `incomplete` PGs, no `unfound` objects. Everything was `active+undersized+degraded`, which
just means some placement groups were running on fewer than their full three copies while the
cluster rebuilt.

This is where size=3, min_size=2 earns its keep. Three copies of everything. Losing one OSD
out of 32 means every piece of data still has two other replicas alive. The cluster was never
in danger of loss from a single failed drive, it was only ever in danger of being slow while
it made a third copy again. Redundancy did the boring thing it exists to do. The panic was me
watching it work and misreading the symptoms.

## Making it usable while it healed

The one useful lever I found: you can throttle Ceph recovery so it stops
starving your clients of I/O. Recovery will take longer, but your VMs will actually boot.

```bash
ceph tell osd.* config set osd_max_backfills 1
ceph tell osd.* config set osd_recovery_max_active 1
ceph tell osd.* config set osd_recovery_sleep_hdd 0.1
```

You are trading recovery speed for client latency on purpose. Once the VMs are happy and
you're not staring at a hung bootloader, you can turn the numbers back up and let it finish
faster.

One caveat if this does nothing for you: on recent Ceph (Quincy and Reef) the default
scheduler is mClock, and it ignores these knobs unless you also set
`osd_mclock_override_recovery_settings true`. If you set the backfill numbers and the cluster
shrugs, that's why.

## Confirming a drive was actually dead

The bifurcation drive came back once I fixed the lane allocation. The other 980 PRO did not.
I pulled both suspect drives, put them in a USB-to-NVMe adapter, and plugged them into a
different machine. One worked. The other was not recognized at all, on a different
computer, over a different interface. That is the cleanest possible proof that it is the drive
and not your config: it fails everywhere, independent of the system that was blamed for it.
Drives also die disproportionately at power cycles, so the reboot is a plausible executioner on
its own. The GPU didn't kill it, it just forced the reboot that surfaced it.

So the final tally was one drive recovered by fixing firmware, one drive definitely dead, and
one OSD purged for BlueStore corruption. Replacement drives were already on the way, and the
fix from there is unglamorous: add them back as new OSDs, one at a time so the rebalance load
spreads out.

## What I took away

The headline blames the GPU, but the useful lesson is smaller, and it isn't "the GPU stole the
lanes." On a dedicated-lane EPYC board it can't. It's that any trip into BIOS for a hardware
change can leave a bifurcation slot on the wrong setting, and the tell for that is a device
that shows up in `lspci` but not in `nvme list`. If you run NVMe on a bifurcation carrier,
touching the machine at all is not a neutral change.

The other half is on me. I burned the first hour on a missing keyring that turned out to be
three layers downstream of the real problem, because a missing keyring is what you fix on a
healthy system. I had the evidence that the drive was gone before I did anything useful with it.

The takeaway I'm keeping: before any planned hardware change, set `noout` so the cluster
doesn't start rebalancing the second an OSD blips, and capture `nvme list`, `lspci`, and
`ceph -s` before and after. A clean before/after diff would have pointed me at the bifurcation
in minutes instead of hours.

The data was fine the whole time. size=3, min_size=2 is the reason a dead drive was an
annoyance and not a catastrophe.

Thankfully now, it's probably fine.
