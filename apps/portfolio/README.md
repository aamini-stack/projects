# Monorepo Overview

This repository serves as a monorepo for various personal web projects and applications. The primary goal of this `README.md` is to provide a high-level overview for AI agents to quickly understand the project structure, technologies, and how to navigate for development tasks.

## Project Structure

The monorepo is organized into `apps/` for individual applications. Currently, it contains:

- `apps/portfolio`: The main personal portfolio website.

Each application within `apps/` is a self-contained project with its own `src/`, `public/`, and configuration files.

### Key Directories within `apps/portfolio`:

```
src/
├── components/       # Houses reusable React components used across the application.
├── lib/              # Stores utility functions, data, and business logic.
└── pages/            # Contains Astro pages, defining routes and overall page structure.
public/               # Static assets such as images, fonts, and the resume PDF.
e2e/                  # End-to-end tests for the application.
__mocks__/            # Mock files for testing purposes.
```

## Technologies Used

This monorepo primarily utilizes modern web technologies. For the `portfolio` application, the core technologies include:

- **Frameworks**: Astro (for static site generation and routing), React (for interactive UI components).
- **Languages**: TypeScript, JavaScript, HTML, CSS.
- **Styling**: Tailwind CSS.
- **Testing**: Vitest (for unit tests), Playwright (for end-to-end tests).
- **Package Manager**: pnpm.

Additionally, the `public/skills` directory showcases a broader range of technologies and skills, including Docker, Kubernetes, Azure, PostgreSQL, Spring, Java, and Python, which represent the developer's expertise but are not necessarily used in the build of this specific portfolio application.

## Development and Navigation for Feature Work

To work on features or fix bugs within the `apps/portfolio` project, follow these general guidelines:

1.  **Install Dependencies**: Ensure `pnpm` is installed, then run `pnpm install` from the monorepo root.
2.  **Navigate to Project**: Change directory into `apps/portfolio`.
3.  **Run Development Server**: Use `pnpm run dev` to start the local development server.
4.  **Code Location**:
    - For page-level content and routing, look in `src/pages`.
    - For UI elements, check `src/components`.
    - For shared logic and data, refer to `src/lib`.
5.  **Testing**:
    - Run unit tests with `pnpm run test`.
    - Run end-to-end tests with `pnpm run e2e`.
6.  **Build**: To build the application for production, use `pnpm run build`.

When implementing new features or making changes, always prioritize adhering to existing code conventions, styling, and architectural patterns found within the relevant `src/` subdirectories.
