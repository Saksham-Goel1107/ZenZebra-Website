# ZenZebra - Curated Lifestyle Where You Already Are

![ZenZebra Banner](https://fra.cloud.appwrite.io/v1/storage/buckets/698585f2000d68784efd/files/698592c00021ba481e19/view?project=698585dc0014c943f45e&mode=admin)

> **World’s first lifestyle-integrated brand.**
> Discover, try, and buy premium products right where you live, work, and relax.

ZenZebra brings curated lifestyle products directly into your daily spaces - offices, gyms, cafés, and malls. Try first, own after. No pressure, no guesswork, just better living by design.

---

## 🚀 Tech Stack

Built with the latest modern web technologies for performance and experience:

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router & Turbopack)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Storage/Assets**: [Appwrite](https://appwrite.io/)
- **Monitoring**: [Sentry](https://sentry.io/)
- **Linting & Formatting**: ESLint, Prettier, Husky, Lint-staged

## 🛠️ Getting Started

### Prerequisites

- Node.js (Latest LTS recommended)
- [pnpm](https://pnpm.io/) (Package Manager)

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/Saksham-Goel1107/ZenZebra-Website.git
    cd "ZenZebra Website"
    ```

2.  **Install dependencies:**

    ```bash
    pnpm install
    ```

3.  **Run the development server:**

    ```bash
    pnpm dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📂 Project Structure

```bash
├── app/                  # App Router pages and layouts
│   ├── brands/           # Brands page
│   ├── catalogue/        # Catalogue viewing page
│   ├── layout.tsx        # Root layout & Metadata
│   └── page.tsx          # Home page
├── components/           # Reusable UI components
│   ├── Catalog.tsx       # PDF Catalogue Viewer
│   ├── Navbar.tsx        # Responsive Navigation
│   ├── Ticker.tsx        # Infinite Brand Carousel
│   └── ...
├── public/               # Static assets
└── ...
```

## 📜 Scripts

| Script         | Description                                   |
| -------------- | --------------------------------------------- |
| `pnpm dev`     | Starts the development server with Turbopack. |
| `pnpm build`   | Builds the application for production.        |
| `pnpm start`   | Runs the built production application.        |
| `pnpm lint`    | Runs ESLint to check for code quality issues. |
| `pnpm format`  | Formats all supported files using Prettier.   |
| `pnpm prepare` | Sets up Husky git hooks.                      |

## 🤝 Contributing

We enforce high code quality standards using **Husky** and **lint-staged**.

- **Pre-commit Hook**: Automatically formats your code (Prettier) and fixes linting errors (ESLint) before you commit.
- **Formatting**: Ensure your editor is set to format on save or run `pnpm format` manually.

## 📬 Contact

- **Email**: [tanmay@zenzebra.in](mailto:tanmay@zenzebra.in) | [gurpreet@zenzebra.in](mailto:gurpreet@zenzebra.in)
- **Phone**: +91 9910605187
- **Socials**: [LinkedIn](https://www.linkedin.com/company/zenzebraindia/) | [Instagram](https://www.instagram.com/zenzebraindia/)

---

© 2026 ZenZebra. All rights reserved.
