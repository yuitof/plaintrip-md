# Travel Plan Viewer

A quiet, read-only itinerary website powered by Markdown files in public GitHub repositories. The viewer has no editor and stores no trip data: change the Markdown in GitHub, then refresh the same shared URL.

The root page renders [`sample-travel-plan.md`](./sample-travel-plan.md), so this project works immediately after cloning. You never have to rename a file before running it.

## Try it locally

```sh
npm install
npm run dev
```

Open <http://localhost:3000>. Useful checks are:

```sh
npm run check
npm test
npm run build
```

`npm run build` creates the ChatGPT Sites-compatible build. On Vercel, the same command automatically uses the native Next.js build. `npm run build:next` is also available for other Node.js hosts.

## Keep plans separate from the viewer

The recommended setup uses two repositories:

- this repository is the reusable viewer;
- a small public repository contains an itinerary and its `route.yaml`.

Use the companion `travel-plan-template` repository as a GitHub template, or copy its files into a new public repository. Edit the Markdown, commit it, and open its configured route on a deployed viewer.

For example, these can display the same file:

```text
/yuitof/china-travel-2026
/yuitof/china-travel-2026/travel-plan
/yuitof
```

Nothing makes `travel-plan.md` a special filename. The routes work only because the YAML maps them to that file.

## Configure routes

Put `route.yaml` at the root of an itinerary repository:

```yaml
version: 1

routes:
  /: travel-plan.md
  /travel-plan: travel-plan.md
  /packing: notes/packing-list.md
  /week-one: schedules/shanghai-and-wuhan.md
```

If this file is in `yuitof/china-travel-2026`, the mappings are:

| Viewer path | GitHub source |
| --- | --- |
| `/yuitof/china-travel-2026` | `travel-plan.md` |
| `/yuitof/china-travel-2026/travel-plan` | `travel-plan.md` |
| `/yuitof/china-travel-2026/packing` | `notes/packing-list.md` |

Routes are explicit. There is no default itinerary filename, extension guessing, folder fallback, or ACL. Rename and organize Markdown however you like, then update the right-hand side of the mapping. Unmapped URLs return the not-found page.

The viewer tries the repository's `main` branch and then `master`. GitHub responses are cached briefly, so a committed edit may take about a minute to appear.

### Add an owner home

For `/yuitof` the viewer needs a predictable place to discover routing because the URL contains no repository name. It uses the GitHub profile repository convention: create the public repository `yuitof/yuitof` and add this `route.yaml`:

```yaml
version: 1

routes:
  /:
    repository: china-travel-2026
    file: travel-plan.md
```

Now `/yuitof` loads `yuitof/china-travel-2026/travel-plan.md`. The target repository can use any filename; edit `file` when it changes. Cross-account targets are intentionally not supported, so an owner home stays within that owner's public repositories.

This is routing, not access control. Every source file remains readable in its public GitHub repository and through GitHub's raw-file URL. Do not commit passport numbers, booking codes, home addresses, API keys, or other secrets. Private repositories are not supported yet.

## Write a plan

Start from [`sample-travel-plan.md`](./sample-travel-plan.md). The renderer understands:

- frontmatter fields `title`, `description`, `route`, `budget`, and `updated`;
- `## Before you go` as a task list;
- `## Itinerary` with one `###` section and four-column Markdown table per day;
- `## Ideas to discuss` and `## Practical notes` as lists;
- status values `Booked`, `Planned`, `Flexible`, `Confirm`, `Decide`, and `Idea`.

Separate route stops with `→`. Keep itinerary columns in this order: `Time`, `Plan`, `Details`, `Status`. Time ranges use an en dash, for example `09:00–10:30`; the viewer stacks the start and end vertically.

## Deploy the viewer

You deploy this viewer once. Friends can then make itinerary repositories and share new routes without deploying another website or exporting another PDF.

### ChatGPT Sites

1. Clone this repository and open the folder in ChatGPT on the web or desktop.
2. Ask ChatGPT to preview the website and run `npm run check`, `npm test`, and `npm run build:sites`.
3. Mention `@Sites` or ask to deploy the website with ChatGPT Sites.
4. Review the preview, choose the narrowest useful Site access setting, and publish.
5. Share the stable Site URL plus `/OWNER/REPOSITORY` for an itinerary.

Every Sites deployment URL is a production deployment. You can ask ChatGPT to save a version without deploying while reviewing changes, then deploy when ready. See the official [ChatGPT Sites guide](https://learn.chatgpt.com/docs/sites).

The generated `.openai/hosting.json` identifies your own Site and is intentionally ignored by Git; every clone should create its own deployment metadata.

### Vercel

1. Fork or push this viewer to GitHub.
2. In Vercel, choose **New Project**, import the repository, and deploy with the detected Next.js settings.
3. Keep the default build command, `npm run build`; Vercel sets the environment flag that selects `next build`.
4. Share the Vercel URL plus a configured route.

Vercel redeploys viewer code when its Git branch changes. It does not need a redeploy when somebody edits a separate itinerary repository. See Vercel's official [Next.js](https://vercel.com/docs/frameworks/full-stack/nextjs) and [Git integration](https://vercel.com/docs/git/vercel-for-github) guides.

## Publish the template repository

Push the companion `travel-plan-template` folder to GitHub. In that repository's settings, enable **Template repository**. Friends can then choose **Use this template** to create an independent itinerary with clean history; GitHub documents that workflow in [Creating a repository from a template](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-repository-from-a-template).
