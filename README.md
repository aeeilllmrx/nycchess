## Overview

This is a Next.js app that powers this [site](https://nycchess.vercel.app/).

Each section of the site has its own directory in `src/app/`. Auxiliary logic pieces live in `src/components/`. Styling is (very basic) Tailwind.

## Local dev

To run locally, run `npm run dev` or `yarn dev` and open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

To make changes to the site:

- update your local branch with the latest changes
  - `git fetch origin`
  - `git rebase origin/main`
- run locally and make sure the site isn't broken
- make sure linting passes
  - if necessary, install the necessary plugins:
    - `npm install --save-dev eslint-plugin-react eslint-plugin-import`
  - then run `npm run lint`
