---
title: "I reserved 2,887 GiB for metadata. Ceph uses 87."
description: "I sized BlueStore metadata for nineteen spinning-disk OSDs at 4% and reserved 2,887 GiB. They use 87.2 GiB, and the benchmark I was about to publish turned out to be a benchmark of my own VM."
date: 2026-09-01
tags: ["ceph", "storage", "homelab", "measurement"]
aiRole: drafted
draft: false
---

Every spinning disk in my Ceph cluster has a little database living alongside its data. RocksDB holds the object metadata, checksums, and write-ahead log. When that database lives on the spinning disk too, every write is competing with itself, then compaction comes along later and asks for random I/O all over again.

So I moved it to NVMe. That part worked. The warnings cleared, slow ops went away, and the cluster stopped having a bunch of work queued behind deep scrubs.

Then I counted the space.

I sized each database partition at 4% of its hard drive, the conservative end of the Reef-era guidance I was working from. Across two nodes, those partitions total 2,887 GiB of enterprise NVMe. Nineteen OSDs are using 87.2 GiB of it.

That is three percent.

[Ceph's current sizing notes](https://docs.ceph.com/en/latest/rados/configuration/bluestore-config-ref/#sizing) put `block.db` at a 2.5% floor in general, then explain why the workload and release matter. On releases before Squid, 4% was recommended for RGW while RBD usually needed 1% to 2%. This cluster is on Reef. I used 4% for every disk anyway.

The docs weren't wrong. I'd taken the conservative number for one workload and treated it like a measurement of mine.

| | disks | reserved | actually used | spilled back to HDD |
|---|---:|---:|---:|---:|
| first node | 12 | 1,370 GiB | 46.8 GiB | 0 |
| second node | 7 | 1,517 GiB | 40.4 GiB | 0 |
| total | 19 | 2,887 GiB | 87.2 GiB | 0 |

The OSDs sit between 2.3% and 4.4% of their own reserved space. Nothing's spilling back onto a hard disk. The plan also capped one NVMe at ten HDD OSDs. [Ceph's current hardware guide](https://docs.ceph.com/en/latest/start/hardware-recommendations/#storage-drives) allows up to fifteen; ten was our blast-radius choice, not a product limit. The twelve-disk node's database is using 47 GiB. One enterprise NVMe isn't having a hard time with that.

There's a real downside. Losing that NVMe now loses twelve OSDs rather than ten. It isn't data loss, because the pool has three replicas and host-level failure domains, but rebuilding twelve OSDs means moving roughly 23 TiB around spinning disks while the cluster is degraded. I took that trade because leaving two disks out on a rule the measurements didn't support was worse.

I also checked the part that can make a present-tense number lie. Metadata grows with object count. At 85% full, the two nodes project to about 134 GiB and 98 GiB in use. They still fit easily, and there's another 368 GiB and 221 GiB unallocated in the volume groups. This is why I'm not replacing the drives with smaller, faster Optanes just because 87 GiB looks funny today. It has to fit when the cluster is full, not just while I'm writing the post about it.

There are two commands involved in moving a BlueStore database. First you attach the new device. Then you run `bluefs-bdev-migrate` to move the existing BlueFS data onto it.

I went looking for a shortcut after the first command left seven `BLUEFS_SPILLOVER` warnings behind. The common answer is `ceph tell osd.N compact`. It did move almost everything, then stopped with somewhere between 128 and 256 KiB still on each hard disk. That's enough for Ceph to keep the warning up, even though the new database devices were nearly empty.

The warnings stayed there for three days because I didn't want to suppress them. A warning that's suppressed when it's harmless is also suppressed when it isn't harmless, and this is the only storage I have.

`bluefs-bdev-migrate` cleared them. Nineteen OSDs, about two minutes. If you are doing this yourself, run both commands. Compaction gets you close and then leaves you there.

## The number I cannot claim

After the work, previously untouched reads from the volume where my local models live came back between 318 and 662 MB/s. Before, I had measured less than 1.3 MB/s.

I wanted that to be the result of moving the metadata. It's not a claim I can support.

The before number was from a cluster with seven OSDs spilling, slow-operation alerts, 19 to 71 ms commit latency, and around eighty placement groups behind on deep scrub. The after number was from a cluster where those things weren't happening. Both readings are real. They aren't a controlled comparison because I never took a healthy baseline before I started changing things.

I just never measured before.

The migration definitely cleared the spillover. It cleared the slow-op alert. NVMe commit latency went to zero, and the estate's alert count fell from 38 to 10. Those are good results. The 500x number is a number I saw while the cluster got healthy, not proof of why it got healthy. I can't make it more than that.

The verification was fifteen large sequential reads from the VM I work out of. One of them hung. Right after rebuilding metadata on nineteen disks, that is a pretty convincing way to make yourself think you found a bad shard.

The VM had run out of memory. It's got 24 GiB and no swap. By the time it fell over, it had 22.5 GiB of anonymous memory and 25.1 MiB of page cache. The kernel was evicting pages that were immediately faulted back in and read from Ceph again. The OOM victim ended in `filemap_fault`.

I caught it by watching the command stream, forced the VM off and back on, then ran the same offset again at 553 MB/s.

The benchmark was testing my client.

It did accidentally give me the best storage test of the whole thing. While the VM was thrashing, it pulled 1.2 GB/s of reads for twelve minutes. Nothing was being written and the other guests were idle. Its host received 1,018 MB/s on the network in the same minute, roughly 8.1 Gbit/s, and iowait was 0.002.

The disks were not the limit. The wire was.

Three replicas with a host-level failure domain means most of those reads crossed the network from another machine. The new ceiling is one unbonded 10 GbE port carrying both storage and guest traffic. Four nodes would need different NICs before I could do much about that. I'd rather have a known bottleneck for a while than buy my way into the next one immediately after finding out I was wrong about the last one.

It's probably fine.

**How this one was made.** I did the physical drive work and reviewed the plan. A Claude session ran the metadata migration and most of the verification under my direction. I was watching during the failed test, which is why the VM got rebooted instead of the storage getting blamed. The later sweep of metadata use, guest activity, and the OOM record was agent-assisted too. The numbers were checked against the live cluster while this draft was written. More on why I disclose that at [how I use AI](/blog/how-i-use-ai), and the current rules at [/ai](/ai).

*Related: [how installing a GPU took down my storage cluster](/blog/gpu-took-down-ceph).*
