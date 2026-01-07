# PAAS

Hello fellow JavaScript (🤮) Developers! I’ve recently started getting
frustrated with Vercel (_cough_ 🍉) and been looking to make the switch to a
free alternative. There are some amazing options out there (Coolify, Dokploy,
Kubero, +20 others…). But they were all missing in a few kew areas and didn’t
quite give that Vercel-like experience I’ve come to get addicted to. I wanted to
make a seriously world-class PaaS experience with these non-negotiable features:

- 100% Free & Open Source from now until the end of time. The project uses an
  unmodified Apache 2.0 license
- A beautiful and modern react UI (similar to Dokploy)
- Zero-config. All you need to do is give a React GitHub repo and it will take
  care of and deploy everything.
- Preview environments for each git branch to make testing changes and
  collaboration easy.
- Have Kubernetes run the apps under the hood. Your apps will harness the power
  of Kubernetes while requiring 0 Kubernetes knowledge for the user.
- IaC as a 1st class feature. Make it so that all settings can be
  encoded/decoded as plain JSON. Also expose Terraform and Pulumi installation
  scripts (A traditional 1-line shell install script will be supported as well)

# Core: Basic GitHub API integration + MVP

- Feature: Setup github webhook connection
- Feature: Auth page with github login
- Feature: Allow user to import repositories
- Feature: Import button with repo selection
- Feature: Onbboarding dialog to configure initial settings when importing a new
  app/repo. (Ex: build command, what package manager to use, etc).
- Feature: UI to show build logs as new repo is building for the first time.
  (Can be mocked).
- Feature: Have the home page show a list of all the apps that have been built
  and deployed.
- Feature: Listen for changes to main
- Feature: Trigger Re-build whenever main changes. (Can mock build)
- Feature: Container runtime system for running

# Important but non-critical features

- Feature: Add preview deployments.
- Feature: Add health checks
- Feature: Add env vars in the UI
- Feature: Basic settings page
