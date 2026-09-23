// The lab's numbers, in one place.
//
// Every figure the site states about the running lab lives here with the date it
// was last checked against the live system and the way to check it again. Pages
// import these instead of typing the number, so a quarterly pass is one edit per
// fact rather than a hunt through every page that repeats it. The cluster is not
// reachable from CI, so nothing here is fetched at build time: it is re-verified
// by hand and the date moves when it is.
//
// Posts are dated and do not read from this file. A post's numbers describe the
// lab on the day it was published.

export interface Fact<T> {
  value: T;
  /** Date the value was last checked against the live system (YYYY-MM-DD). */
  verified: string;
  /** Where the value comes from and how to check it again. */
  source: string;
}

const fact = <T>(value: T, verified: string, source: string): Fact<T> => ({ value, verified, source });

/** Kubernetes nodes, control plane plus workers. */
export const talosNodes = fact(9, '2026-09-23', 'kubectl get nodes --no-headers | wc -l');

/** ArgoCD Application objects. Counts Applications, not workloads or pods. */
export const argoApplications = fact(
  53,
  '2026-09-23',
  'kubectl get applications.argoproj.io -A --no-headers | wc -l',
);

/** Ceph raw capacity, rounded. 229.7 TiB on 2026-09-23. */
export const cephRawTiB = fact(
  230,
  '2026-09-23',
  'Prometheus ceph_cluster_total_bytes / 2^40, or `ceph df` on any Proxmox node',
);

export interface Node {
  name: string;
  cpu: string;
  cores: number;
  threads: number;
  /** Installed memory in GB, as the DIMMs are labelled (not the smaller usable figure). */
  ramGB: number;
  ecc: boolean;
  gpu: string;
  role: string;
}

/**
 * The Proxmox nodes. RAM and thread counts checked 2026-09-23 against the Proxmox
 * exporter (pve_memory_size_bytes, pve_cpu_usage_limit); board and chassis from
 * node_dmi_info; DIMM layout from the 2026-09-20 dmidecode read recorded in
 * the private hardware inventory.
 */
export const proxmoxNodes = fact<Node[]>(
  [
    { name: 'pve-00', cpu: 'AMD EPYC 7282', cores: 16, threads: 32, ramGB: 256, ecc: true, gpu: 'RTX 4070 Ti + GTX 1660', role: 'Flagship compute / GPU' },
    { name: 'pve-01', cpu: 'Threadripper 2920X', cores: 12, threads: 24, ramGB: 256, ecc: true, gpu: 'GTX 1080 Ti', role: 'Compute / GPU' },
    { name: 'pve-02', cpu: 'Core i7-6700', cores: 4, threads: 8, ramGB: 64, ecc: false, gpu: 'iGPU only', role: 'Capacity / quorum' },
    { name: 'pve-03', cpu: 'Core i7-6700', cores: 4, threads: 8, ramGB: 48, ecc: false, gpu: 'iGPU only', role: 'Capacity / quorum' },
    { name: 'pve-04', cpu: 'Core i7-7700', cores: 4, threads: 8, ramGB: 48, ecc: false, gpu: 'iGPU only', role: 'Capacity / quorum' },
  ],
  '2026-09-23',
  'Prometheus pve_memory_size_bytes and pve_cpu_usage_limit per node/*, node_dmi_info',
);

export interface Gpu {
  card: string;
  arch: string;
  host: string;
  /** Time-slicing replicas the NVIDIA device plugin advertises for this card. */
  slots: number;
}

/** GPUs and their time-slicing slots. MPS is not used anywhere; see /labs for why. */
export const gpus = fact<Gpu[]>(
  [
    { card: 'RTX 4070 Ti', arch: 'Ada Lovelace', host: 'pve-00', slots: 2 },
    { card: 'GTX 1660', arch: 'Turing', host: 'pve-00', slots: 2 },
    { card: 'GTX 1080 Ti', arch: 'Pascal', host: 'pve-01', slots: 5 },
  ],
  '2026-09-23',
  'nvidia-device-plugin-configs ConfigMap (ts-* replicas) and nvidia.com/gpu capacity on the GPU worker nodes',
);

/** Totals derived from the node list, so they cannot drift from it. */
export const clusterTotals = {
  nodes: proxmoxNodes.value.length,
  cores: proxmoxNodes.value.reduce((n, x) => n + x.cores, 0),
  threads: proxmoxNodes.value.reduce((n, x) => n + x.threads, 0),
  ramGB: proxmoxNodes.value.reduce((n, x) => n + x.ramGB, 0),
  gpus: gpus.value.length,
};
