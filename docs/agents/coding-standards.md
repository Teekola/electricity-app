# Coding Standards

Comments should be rare: only explain non-obvious why that cannot be expressed clearly in the code. Prefer clear names and types; otherwise, don't comment.

Rareness wins over coverage: an export earns TSDoc (`/** ... */`) only when it has a non-obvious why to state, so the note shows on IDE hover. Most exports do not, and a comment that restates the signature is worse than none. Use TSDoc rather than `//` when the note does belong on an export, a type's field, or a public API boundary.

`any`, `!`, `as`, `@ts-expect-error`, and `eslint-disable` are **escape hatches**: each one in this repo carries a one-line comment naming what makes it unavoidable. An uncommented one is a defect in review. `as const` is not one of them — it narrows a literal instead of asserting a type, so it cannot mask an error.
