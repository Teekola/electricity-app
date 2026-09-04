# Coding Standards

Comments should be rare: only explain non-obvious why that cannot be expressed clearly in the code. Prefer clear names and types; otherwise, don't comment.

TSDoc (`/** ... */`) on exported functions, complex generics, and public API boundaries, so the description shows on IDE hover.

`any`, `!`, `as`, `@ts-expect-error`, and `eslint-disable` are **escape hatches**: each one in this repo carries a one-line comment naming what makes it unavoidable. An uncommented one is a defect in review. `as const` is not one of them — it narrows a literal instead of asserting a type, so it cannot mask an error.
