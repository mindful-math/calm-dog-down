# Commit Description Guidelines

When writing commit messages, follow the [Conventional Commits](https://conventionalcommits.org/) specification. Analyze the git diff and task context to create meaningful descriptions that explain what changed and why.

## Best Practices

- **Be specific**: Mention actual files and functions changed
- **Explain why**: Include context about the problem solved or feature added
- **Keep concise**: Aim for 50-72 characters in the subject line
- **Use imperative mood**: "Add feature" not "Added feature"
- **Reference issues**: Include issue/PR numbers when applicable

## Structure

**Format:**
```
<type>[optional scope]: <description>

[optional body]

[optional footer]
```

- **type**: The type of change (feat, fix, docs, refactor, test, chore, etc.)
- **scope**: Optional context (e.g., component or file affected)
- **description**: Brief summary in imperative mood (50-72 characters recommended)
- **body**: Optional detailed explanation with bullet points for granular changes
- **footer**: Optional references to issues/PRs (e.g., "Closes #123")

