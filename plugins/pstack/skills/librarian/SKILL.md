---
name: librarian
description: Find and locally cache source repositories for dependency internals or external implementation comparisons. Use before fetching GitHub source from the web, when inspecting how an npm dependency works, or when the user gives a GitHub repository to compare with the current codebase.
---

# Librarian

Resolve the repository before reading external source:

```sh
<skill-dir>/scripts/lookup.mjs <github-url-or-npm-package>
```

The command prints one absolute path. It clones a missing repository into `~/.librarian/github.com/<owner>/<repo>`. For an existing clone, it runs `git pull --ff-only` before returning the path. Set `LIBRARIAN_HOME` to change the storage root.

Use the returned path with local file tools. Treat it as read-only reference material. Continue work in the user's current project.

Examples:

```sh
<skill-dir>/scripts/lookup.mjs https://github.com/Effect-TS/effect
<skill-dir>/scripts/lookup.mjs effect
<skill-dir>/scripts/lookup.mjs @effect/schema
```

The npm form reads the package's `repository` metadata. If the package does not point to GitHub, report the error and use the source location the user provides.
