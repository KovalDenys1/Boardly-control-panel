<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Git & Workflow Conventions

## Tickets first, then commits

Every piece of work must have a GitHub Issue before any code is committed.

1. Create (or verify) a GitHub Issue describing the task.
2. Work on the code.
3. Commit with the issue number in the message title.

## Commit message format

```
#<issue-number> <type>: <short description>
```

Examples:
```
#11 feat: add audit log viewer page
#7 fix: exclude bots from player count on games page
#3 chore: set up Prisma client and database connection
```

Types: `feat`, `fix`, `chore`, `refactor`, `docs`, `style`, `test`

**Never commit without a corresponding GitHub Issue number in the title.**
