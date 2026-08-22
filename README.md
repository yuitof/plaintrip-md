# PlainTrip MD

PlainTrip MD is a quiet, read-only viewer for [TripMD / itinerary-md](https://github.com/cumuloworks/itinerary-md) Markdown. It uses the same open-source itinerary parser and alert parser as TripMD, then presents the result as a shareable preview without an editor, account, or itinerary database.

The root page loads the `/` route from [`yuitof/plaintrip-md-template`](https://github.com/yuitof/plaintrip-md-template), the public template repository users can clone. The template keeps its default itinerary in `plaintrip.md`.

## Run it locally

```sh
npm install
npm run dev
```

Open <http://localhost:3000>. Before publishing, run:

```sh
npm run check
npm test
npm run build
```

`npm run build` creates a ChatGPT Sites-compatible worker build. On Vercel, the same command automatically selects the native Next.js build. You can also run either target explicitly with `npm run build:sites` or `npm run build:next`. After a Sites build, `npm run start` serves that worker locally with Wrangler.

## Preview controls

The surrounding toolbar follows TripMD Studio's preview layout without including its editor:

- **TZ** is read-only. It uses the timezone declared in the Markdown; if the document has none, it falls back to the viewer's device timezone.
- **Cur** changes the display currency and stores the choice in the shared URL as `?cur=JPY`. Converted prices are approximate and use USD-based rates cached for 12 hours.
- **Source** opens the public itinerary repository.
- **Share URL** copies the current URL and confirms it with a bottom-right toast.

The GitHub and information icons in the header link back to the PlainTrip MD project.

## Write an itinerary

TripMD mode starts with `type: tripmd` in YAML frontmatter:

```md
---
type: tripmd
title: A week in Japan
description: Trains, food, and room for detours.
tags: [Japan, Friends, 2027]
budget: 120000 JPY
currency: JPY
timezone: Asia/Tokyo
---

## Before leaving

- [ ] Reserve the train
- [ ] Pack a power adapter

## 2027-04-03 @Asia/Tokyo

> [09:15] - [11:30] train Shinkansen :: Tokyo - Kyoto
>
> - class: Reserved
> - price: 13970 JPY
> - status: Booked

> [pm] sightseeing Walk through Gion
>
> - details: Keep this flexible if it rains
> - status: Idea

> [!NOTE] Plan B
>
> Move the walk to Sunday if Saturday is wet.
```

Use `## YYYY-MM-DD` for date headings. Add `@Area/City` when a day uses a different timezone. An event begins with a blockquote:

```text
> [start] - [end] type Title :: From - To
```

- Times can be exact (`[09:15]`), broad (`[am]` or `[pm]`), omitted (`[]`), or next-day (`[06:30+1]`).
- Common event types such as `flight`, `train`, `ferry`, `hotel`, `meeting`, `shopping`, and `sightseeing` receive matching timeline icons.
- `:: Place` is a single location; `:: From - To` is a journey.
- Indented blockquote list items add metadata such as `price`, `status`, `seat`, `duration`, and `details`.
- Price values can use arithmetic such as `{25*4} USD`. PlainTrip MD displays the calculated amount (and converts it when a different display currency is selected) while evaluating numbers and arithmetic operators only—never variables or functions.
- Normal Markdown, GFM tables, task lists, links, and `[!NOTE]`-style alerts remain available around the itinerary.

See the complete [`plaintrip.md`](https://github.com/yuitof/plaintrip-md-template/blob/main/plaintrip.md) example and the upstream [TripMD syntax reference](https://github.com/cumuloworks/itinerary-md#syntax).

## Keep personal plans in separate repositories

The cleanest setup uses two repositories:

- deploy PlainTrip MD once as the viewer;
- keep each itinerary and its `route.yaml` in a small public repository.

When the Markdown changes on GitHub, the same shared viewer URL shows the update after its short cache expires. There is no new PDF and no viewer redeployment.

For example, all of these routes can point to the same file:

```text
/octocat/lisbon-weekend
/octocat/lisbon-weekend/plaintrip
/octocat
```

`plaintrip.md` is the default convention, not a hardcoded requirement. Each URL exists only when `route.yaml` maps it.

## Configure routes

Put `route.yaml` at the root of an itinerary repository:

```yaml
version: 1

routes:
  /: plaintrip.md
  /plaintrip: plaintrip.md
  /packing: notes/packing-list.md
  /food: notes/restaurants.md
```

If this file is in `octocat/lisbon-weekend`, the viewer resolves:

| Viewer URL path | Public GitHub file |
| --- | --- |
| `/octocat/lisbon-weekend` | `plaintrip.md` |
| `/octocat/lisbon-weekend/plaintrip` | `plaintrip.md` |
| `/octocat/lisbon-weekend/packing` | `notes/packing-list.md` |

Routes are explicit. PlainTrip MD does not guess a default filename, extension, or folder index. It checks the repository's `main` branch and then `master`. GitHub responses are cached for about a minute.

### Add an owner home

An owner-only URL such as `/octocat` has no repository segment, so its routing lives in the GitHub profile repository `octocat/octocat`:

```yaml
version: 1

routes:
  /:
    repository: lisbon-weekend
    file: plaintrip.md
```

This maps `/octocat` to `octocat/lisbon-weekend/plaintrip.md`. Owner-home targets stay inside the same GitHub account.

This is routing, not access control. Every source file remains readable in its public GitHub repository. Never commit passport numbers, booking codes, home addresses, API keys, or other secrets. Private repositories are not supported yet.

Currency conversion is for rough planning only. Exchange rates and card-provider fees can differ, so verify important totals before booking.

## Deploy the viewer

### ChatGPT Sites

1. Clone this repository and open it in ChatGPT.
2. Ask ChatGPT to run `npm install`, `npm run check`, `npm test`, and `npm run build:sites`.
3. Ask ChatGPT to preview the website, then publish it with ChatGPT Sites when it looks right.
4. Share the stable Site URL followed by `/OWNER/REPOSITORY`.

The local `.openai/hosting.json` identifies one particular Site and is ignored by Git. Each clone creates its own deployment metadata. See the official [ChatGPT Sites guide](https://learn.chatgpt.com/docs/sites).

### Vercel

1. Import this repository as a new Vercel project.
2. Keep the detected Next.js settings and the default `npm run build` command.
3. Deploy, then share the Vercel URL followed by `/OWNER/REPOSITORY`.

Editing an itinerary repository does not require redeploying PlainTrip MD. See Vercel's [Next.js deployment guide](https://vercel.com/docs/frameworks/full-stack/nextjs).

## Make an itinerary template

The ready-to-clone [`yuitof/plaintrip-md-template`](https://github.com/yuitof/plaintrip-md-template) contains only:

```text
route.yaml
plaintrip.md
README.md
```

Enable **Template repository** in its GitHub settings. Friends can choose **Use this template**, edit their Markdown and routes, and share it through any PlainTrip MD deployment. GitHub explains the flow in [Creating a repository from a template](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-repository-from-a-template).

## Upstream compatibility

PlainTrip MD depends on the MIT-licensed `remark-itinerary` and `remark-itinerary-alert` packages from [cumuloworks/itinerary-md](https://github.com/cumuloworks/itinerary-md). Its editor and Studio application are not redistributed here; this repository supplies an independent read-only presentation. See [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md).
