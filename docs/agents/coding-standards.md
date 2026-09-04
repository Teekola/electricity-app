# Coding Standards

A comment earns its place by carrying a **why** the code cannot: the constraint that forced this shape, the upstream bug being worked around, the reason the obvious approach fails. When it is already obvious from the code, the code says it — sharpen names and narrow types over adding a comment.

TSDoc (`/** ... */`) on exported functions, complex generics, and public API boundaries, so the description shows on IDE hover.

`any`, `!`, `as`, `@ts-expect-error`, and `eslint-disable` are **escape hatches**: each one in this repo carries a one-line comment naming what makes it unavoidable. An uncommented one is a defect in review. `as const` is not one of them — it narrows a literal instead of asserting a type, so it cannot mask an error.
