---
title: "Fixture: tutorial pipeline"
description: "A render fixture for the tutorial genre. Not a post. It stays a draft, so it never builds into production."
date: 2026-09-23
tags: ["fixture"]
aiRole: drafted
draft: true
genre: tutorial
outcome:
  summary: "A container on port 8080 serving one static page that answers with a known line."
  command: "curl -s http://192.0.2.10:8080/"
  host: "laptop"
---

This file exercises every piece of the tutorial genre so the pipeline can be checked in a browser. It is `draft: true`: `astro dev` and a `SHOW_DRAFTS=1` build render it, a production build does not. Addresses are documentation ranges and the commands are illustrative.

## Prerequisites

- [x] A Linux host with Docker installed
- [x] Port 8080 free on that host
- [ ] An unchecked item, to show the other state

## [1/3] Write the page

```bash host=laptop
$ mkdir -p site && cd site
$ echo 'hello from the fixture' > index.html
```

> [!NOTE]
> A note callout. It holds ordinary prose and can hold `inline code`.

## [2/3] Start the server

```bash host=laptop expect
$ docker run -d --name fixture -p 8080:80 \
    -v "$PWD":/usr/share/nginx/html:ro \
    nginx:alpine
3f2a9c1d8e7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f
```

> [!WARNING]
> A warning callout. Port 8080 must not already be bound, or `docker run` exits with an address-in-use error.

## [3/3] Check it

> [!VERIFY]
> The container is running.
>
> ```bash host=laptop expect
> $ docker ps --filter name=fixture --format '{{.Names}}  {{.Status}}'
> fixture  Up 12 seconds   # ← this line or stop here
> ```

A long output block, collapsed after four lines:

```bash host=laptop expect collapse=4
$ docker logs fixture
/docker-entrypoint.sh: Configuration complete; ready for start up
192.0.2.21 - - [23/Sep/2026:10:00:01 +0000] "GET / HTTP/1.1" 200 23 "-" "curl/8.5.0"
192.0.2.21 - - [23/Sep/2026:10:00:02 +0000] "GET / HTTP/1.1" 200 23 "-" "curl/8.5.0"
192.0.2.21 - - [23/Sep/2026:10:00:03 +0000] "GET /favicon.ico HTTP/1.1" 404 153 "-" "curl/8.5.0"
198.51.100.7 - - [23/Sep/2026:10:00:04 +0000] "GET / HTTP/1.1" 200 23 "-" "Mozilla/5.0"
198.51.100.7 - - [23/Sep/2026:10:00:05 +0000] "GET / HTTP/1.1" 304 0 "-" "Mozilla/5.0"
198.51.100.7 - - [23/Sep/2026:10:00:06 +0000] "GET / HTTP/1.1" 304 0 "-" "Mozilla/5.0"
198.51.100.7 - - [23/Sep/2026:10:00:07 +0000] "GET / HTTP/1.1" 304 0 "-" "Mozilla/5.0"
```

A transcript without `expect`, where commands and output interleave:

```bash host=laptop
$ uname -s
Linux
$ curl -s http://192.0.2.10:8080/
hello from the fixture
```

The pre-existing forms, which must render exactly as before: an output block and a command block with no prompts.

```text title="journalctl · fixture" kind=output
fixture: started
```

```bash host=laptop kind=bash
docker stop fixture
docker rm fixture
```

> A plain blockquote stays a quotation.

## All the commands

```bash title="all the commands"
$ mkdir -p site && cd site
$ echo 'hello from the fixture' > index.html
$ docker run -d --name fixture -p 8080:80 \
    -v "$PWD":/usr/share/nginx/html:ro \
    nginx:alpine
$ docker ps --filter name=fixture --format '{{.Names}}  {{.Status}}'
$ curl -s http://192.0.2.10:8080/
```
