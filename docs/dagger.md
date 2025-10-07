================
CODE SNIPPETS
================
TITLE: GitHub Actions: Test and Build Workflow
DESCRIPTION: A complex example for GitHub Actions that checks out code, tests a project using Dagger, and builds/publishes a container image.

SOURCE: https://github.com/dagger/dagger/blob/main/docs/current_docs/getting-started/ci-integrations/github-actions.mdx#_snippet_4

LANGUAGE: yaml
CODE:
```
name: Dagger GitHub Test Build

on: [push]

defaults:
  run:
    shell: bash

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Install Dagger
        uses: dagger/dagger-action/install@v0.7.0

      - name: Test Project
        uses: dagger/dagger-action@v0.7.0
        with:
          verb: "call"
          args: |
            -- நாள் "test"
            --source "."

      - name: Build and Publish Image
        uses: dagger/dagger-action@v0.7.0
        with:
          verb: "call"
          args: |
            -- நாள் "build-image"
            --source "."
            --tag "your-dockerhub-username/my-app:latest"
```

--------------------------------

TITLE: GitHub Actions: Dagger Shell Syntax
DESCRIPTION: Shows how to use Dagger shell syntax in GitHub Actions for more advanced chaining and subshell capabilities.

SOURCE: https://github.com/dagger/dagger/blob/main/docs/current_docs/getting-started/ci-integrations/github-actions.mdx#_snippet_3

LANGUAGE: yaml
CODE:
```
name: Dagger GitHub Hello Shell

on: [push]

defaults:
  run:
    shell: bash

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Install Dagger
        uses: dagger/dagger-action/install@v0.7.0

      - name: Run Dagger Shell
        uses: dagger/dagger-action@v0.7.0
        with:
          verb: "shell"
          args: |
            dagger call hello --name World
```

--------------------------------

TITLE: GitHub Actions: Basic Dagger Call
DESCRIPTION: Demonstrates calling a Dagger Function on a standard GitHub runner within a GitHub Actions workflow.

SOURCE: https://github.com/dagger/dagger/blob/main/docs/current_docs/getting-started/ci-integrations/github-actions.mdx#_snippet_2

LANGUAGE: yaml
CODE:
```
name: Dagger GitHub Hello

on: [push]

defaults:
  run:
    shell: bash

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Install Dagger
        uses: dagger/dagger-action/install@v0.7.0

      - name: Run Dagger
        uses: dagger/dagger-action@v0.7.0
        with:
          verb: "call"
          args: |
            -- நாள் "hello"
            --name "World"
```

--------------------------------

TITLE: Monorepo CI Examples
DESCRIPTION: Examples of CI pipelines for monorepos using Dagger, demonstrating how to manage and release multiple assets.

SOURCE: https://github.com/dagger/dagger/blob/main/docs/current_docs/introduction/examples.mdx#_snippet_2

LANGUAGE: en
CODE:
```
- [Dagger](https://github.com/openmeterio/openmeter/tree/main/.dagger)
- [OpenMeter](https://github.com/openmeterio/openmeter/tree/main/.dagger)
```

--------------------------------

TITLE: Dagger GitHub Action Workflow (Depot Runner)
DESCRIPTION: Details the workflow when using Dagger with a Dagger Powered Depot GitHub Actions runner. This includes how Depot manages runners, connects to external Dagger Engines, and utilizes the Dagger CLI.

SOURCE: https://github.com/dagger/dagger/blob/main/docs/current_docs/getting-started/ci-integrations/github-actions.mdx#_snippet_1

LANGUAGE: APIDOC
CODE:
```
GitHub Webhook Event -> Depot Event Processing -> Depot GitHub Actions Runner Launch -> External Dagger Engine Connection -> Dagger CLI Execution (Pre-installed) -> Telemetry -> Workflow Completion
```

--------------------------------

TITLE: Dagger GitHub Action Workflow (Standard Runner)
DESCRIPTION: Illustrates the workflow when using Dagger with a standard GitHub Actions runner. It covers the sequence of events from a repository trigger to the Dagger CLI execution.

SOURCE: https://github.com/dagger/dagger/blob/main/docs/current_docs/getting-started/ci-integrations/github-actions.mdx#_snippet_0

LANGUAGE: APIDOC
CODE:
```
Workflow Trigger -> GitHub Actions Processing -> Dagger for GitHub Action -> Dagger CLI Execution -> Dagger Engine Spin-up/Connection -> Sub-command Execution -> Telemetry (Optional) -> Workflow Completion
```

--------------------------------

TITLE: Dagger CI with Go SDK
DESCRIPTION: CI code for Dagger is implemented using the Go SDK and executed via GitHub Actions. This involves implementing necessary functions in the 'dev/' directory and running local tests using './hack' scripts. New jobs should be added to '.github/workflows/' for CI execution.

SOURCE: https://github.com/dagger/dagger/blob/main/sdk/CONTRIBUTING.md#_snippet_9

LANGUAGE: Go
CODE:
```
package main

import (
	"context"
	"dagger.io/dagger"
)

func main() {
	ctx := context.Background()

	d// Initialize Dagger client
	dclient, err := dagger.Connect(ctx)
	if err != nil {
		panic(err)
	}

	// Example: Run a command in a container
	alpine := client.Container().From("alpine:latest")
	result, err := alpine.WithExec([]string{"echo", "Hello from Dagger!"}).Stdout(ctx)
	if err != nil {
		panic(err)
	}

	println(result)
}
```

--------------------------------

TITLE: GitHub Actions: SSH Agent Setup
DESCRIPTION: Configures the SSH agent in GitHub Actions to use private keys for secure operations.

SOURCE: https://github.com/dagger/dagger/blob/main/docs/current_docs/getting-started/ci-integrations/github-actions.mdx#_snippet_8

LANGUAGE: yaml
CODE:
```
- name: Set up SSH
  run: |
    eval "$(ssh-agent -s)"
    ssh-add - <<< "${{ secrets.SSH_PRIVATE_KEY }}"
```

--------------------------------

TITLE: Depot Runner: Dagger Shell Syntax
DESCRIPTION: Shows how to use Dagger shell syntax with a Dagger Powered Depot runner in GitHub Actions.

SOURCE: https://github.com/dagger/dagger/blob/main/docs/current_docs/getting-started/ci-integrations/github-actions.mdx#_snippet_6

LANGUAGE: yaml
CODE:
```
name: Dagger Depot Hello Shell

on: [push]

defaults:
  run:
    shell: bash

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Install Dagger
        uses: dagger/dagger-action/install@v0.7.0

      - name: Run Dagger Shell on Depot
        uses: dagger/dagger-action@v0.7.0
        with:
          dagger:
            version: "0.7.0"
            platform: "depot"
          verb: "shell"
          args: |
            dagger call hello --name World
```

--------------------------------

TITLE: Depot Runner: Basic Dagger Call
DESCRIPTION: Demonstrates calling a Dagger Function on a Dagger Powered Depot runner in a GitHub Actions workflow.

SOURCE: https://github.com/dagger/dagger/blob/main/docs/current_docs/getting-started/ci-integrations/github-actions.mdx#_snippet_5

LANGUAGE: yaml
CODE:
```
name: Dagger Depot Hello

on: [push]

defaults:
  run:
    shell: bash

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Install Dagger
        uses: dagger/dagger-action/install@v0.7.0

      - name: Run Dagger on Depot
        uses: dagger/dagger-action@v0.7.0
        with:
          dagger:
            version: "0.7.0"
            platform: "depot"
          verb: "call"
          args: |
            -- நாள் "hello"
            --name "World"
```

--------------------------------

TITLE: TypeScript Dagger Module
DESCRIPTION: Replaces the generated .dagger/src/index.ts file to add four Dagger Functions to your Dagger module.

SOURCE: https://github.com/dagger/dagger/blob/main/docs/current_docs/getting-started/quickstarts/ci/index.mdx#_snippet_6

LANGUAGE: typescript
CODE:
```
import * as dagger from "@dagger.io/dagger";

/**
 * MyModule represents a Dagger module.
 */
export class MyModule {
  /**
   * Publish tests, builds and publishes a container image of the application to a registry.
   */
  publish(): void {
    // implementation
  }

  /**
   * Test runs the application's unit tests and returns the results.
   */
  test(): void {
    // implementation
  }

  /**
   * Build performs a multi-stage build and returns a final container image with the production-ready application and an NGINX Web server to host and serve it.
   */
  build(): void {
    // implementation
  }

  /**
   * BuildEnv creates a container with the build environment for the application.
   */
  buildEnv(): void {
    // implementation
  }
}

```

--------------------------------

TITLE: Publish Container Image to GitHub Container Registry using GitHub Actions
DESCRIPTION: An example GitHub Actions workflow that uses Dagger to publish a container image to the GitHub Container Registry (GHCR). This is a common CI/CD pattern for Dagger projects.

SOURCE: https://github.com/dagger/dagger/blob/main/docs/current_docs/getting-started/ci-integrations/github.mdx#_snippet_2

LANGUAGE: yaml
CODE:
```
name: Dagger CI

on:
  push:
    branches: [ main ]

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Dagger
        uses: dagger/dagger-action@v5

      - name: Build and push to GHCR
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          dagger call -m "dagger.io/dagger" publish --dest "ghcr.io/${{ github.repository_owner }}/my-app:latest"
```

--------------------------------

TITLE: Depot Runner: Test and Build Workflow
DESCRIPTION: A complex example for Dagger Powered Depot runners that checks out code, tests a project using Dagger, and builds/publishes a container image.

SOURCE: https://github.com/dagger/dagger/blob/main/docs/current_docs/getting-started/ci-integrations/github-actions.mdx#_snippet_7

LANGUAGE: yaml
CODE:
```
name: Dagger Depot Test Build

on: [push]

defaults:
  run:
    shell: bash

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Install Dagger
        uses: dagger/dagger-action/install@v0.7.0

      - name: Test Project on Depot
        uses: dagger/dagger-action@v0.7.0
        with:
          dagger:
            version: "0.7.0"
            platform: "depot"
          verb: "call"
          args: |
            -- நாள் "test"
            --source "."

      - name: Build and Publish Image on Depot
        uses: dagger/dagger-action@v0.7.0
        with:
          dagger:
            version: "0.7.0"
            platform: "depot"
          verb: "call"
          args: |
            -- நாள் "build-image"
            --source "."
            --tag "your-dockerhub-username/my-app:latest"
```

--------------------------------

TITLE: Clone Example Application
DESCRIPTION: Clones the 'hello-dagger-template' repository from GitHub to use as an example application for building a CI workflow. It then sets this new repository as the current working directory.

SOURCE: https://github.com/dagger/dagger/blob/main/docs/current_docs/getting-started/quickstarts/ci/index.mdx#_snippet_1

LANGUAGE: shell
CODE:
```
gh repo create hello-dagger --template dagger/hello-dagger-template --public --clone
cd hello-dagger
```

--------------------------------

TITLE: Monitor GitHub Actions and Clean Up
DESCRIPTION: Ensures all GitHub Actions checks pass for the automatically created Daggerverse preview PR. If checks pass, the PR is closed and the branch deleted. If checks fail, relevant team members are notified.

SOURCE: https://github.com/dagger/dagger/blob/main/RELEASING.md#_snippet_15

LANGUAGE: console
CODE:
```
# Ensure that all GitHub Actions checks pass for the dagger.io PR which
# gets automatically created part of this PR. The PR is configured to deploy a
# Daggerverse preview environment with a `main` Dagger Engine (the one that is
# just about to be released). If all checks pass, close that PR & delete the
# branch (this will clean up the infra that gets provisioned). If checks fail, cc
# @jpadams @marcosnils @matipan @gerhard in the release thread and wait for a
# response before continuing with the release (this might be a blocker).
```

--------------------------------

TITLE: Commit and Push Dagger Agent Changes to GitHub
DESCRIPTION: This snippet provides the standard Git commands to stage all local changes, commit them with a descriptive message indicating agent deployment, and push the committed changes to the remote GitHub repository. This action makes the Dagger agent project available for execution by GitHub Actions.

SOURCE: https://github.com/dagger/dagger/blob/main/docs/current_docs/quickstart/agent/inproject.mdx#_snippet_21

LANGUAGE: shell
CODE:
```
git add .
git commit -m'deploy agent to github'
git push
```

--------------------------------

TITLE: Configure SSH Agent in GitHub Actions
DESCRIPTION: Ensures proper SSH agent setup when using SSH keys in GitHub Actions workflows. It evaluates the SSH agent and adds a private key from a GitHub secret, replacing '${{ secrets.SSH_PRIVATE_KEY }}' with your actual secret.

SOURCE: https://github.com/dagger/dagger/blob/main/docs/current_docs/ci/integrations/github-actions.mdx#_snippet_0

LANGUAGE: yaml
CODE:
```
- name: Set up SSH
  run: |
    eval "$(ssh-agent -s)"
    ssh-add - <<< '${{ secrets.SSH_PRIVATE_KEY }}'
```

--------------------------------

TITLE: Mount GitHub Auth File as Secret (TypeScript)
DESCRIPTION: This TypeScript code snippet illustrates how to mount a GitHub hosts configuration file as a Dagger Secret to authorize GitHub requests.

SOURCE: https://github.com/dagger/dagger/blob/main/docs/current_docs/partials/cookbook/secrets/_mount-files-as-secret.mdx#_snippet_2

LANGUAGE: typescript
CODE:
```
import * as dagger from "@dagger.io/dagger";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const client = new dagger.Client();

  // Define the path to the GitHub hosts file
  const githubHostsFile = "../../../cookbook/snippets/secret-file/typescript/hosts.yml";

  // Read the content of the hosts file
  const fileContent = fs.readFileSync(githubHostsFile, "utf-8");

  // Create a Dagger Secret from the file content
  const githubAuthSecret = client.setSecret("github-auth-secret", fileContent);

  // Example: Run a container that uses the secret (replace with your actual container)
  // This is a placeholder to demonstrate secret usage.
  const output = await client
    .container()
    .from("alpine")
    .withSecret("GITHUB_AUTH_TOKEN", githubAuthSecret)
    .exec({
      command: ["sh", "-c", "echo $GITHUB_AUTH_TOKEN"],
    })
    .stdout();

  console.log(`GitHub auth secret mounted successfully (example usage). Output: ${output}`);
}

main();

```

--------------------------------

TITLE: Add TypeScript Packages with Runtime Package Managers
DESCRIPTION: Commands to add TypeScript packages using `npm` for Node.js, `bun install` for Bun, or `deno add` for Deno, depending on the chosen runtime.

SOURCE: https://github.com/dagger/dagger/blob/main/docs/current_docs/api/packages.mdx#_snippet_3

LANGUAGE: shell
CODE:
```
npm install pm2
```

LANGUAGE: shell
CODE:
```
bun install pm2
```

LANGUAGE: shell
CODE:
```
deno add jsr:@celusion/simple-validation
```

--------------------------------

TITLE: Initialize Node Project and TypeScript
DESCRIPTION: Creates a new Node.js project, initializes npm, and installs TypeScript and ts-node for development. It also initializes the TypeScript project configuration.

SOURCE: https://github.com/dagger/dagger/blob/main/sdk/typescript/README.md#_snippet_1

LANGUAGE: shell
CODE:
```
mkdir my-test-ts-project

# Init project (you may use yarn or pnpm)
npm init -y

# Add typescript
npm install typescript ts-node --save-dev

# Init typescript project
npx tsc --init
```

--------------------------------

TITLE: Call Dagger Function with GitHub PR Directory
DESCRIPTION: Demonstrates how to pass a GitHub pull request URL as a Directory argument to a Dagger Function. This allows testing code from specific pull requests.

SOURCE: https://github.com/dagger/dagger/blob/main/docs/current_docs/getting-started/ci-integrations/github.mdx#_snippet_0

LANGUAGE: shell
CODE:
```
dagger call foo --directory=https://github.com/ORGANIZATION/REPOSITORY#pull/NUMBER/merge
```

--------------------------------

TITLE: Dagger Shared Module Monorepo Pattern
DESCRIPTION: Depicts a monorepo architecture where a single, shared Dagger automation module is utilized by multiple projects, such as microservices. This pattern is ideal for monorepos with significant commonalities between projects, promoting code reuse, consistent CI environments, reduced onboarding friction, and shared best practices.

SOURCE: https://github.com/dagger/dagger/blob/main/docs/current_docs/api/module-structure.mdx#_snippet_9

LANGUAGE: mermaid
CODE:
```
graph TD
    A[Shared module] --> B[Microservice 1]
    A[Shared module] --> C[Microservice 2]
    A[Shared module] --> D[Microservice 3]
```

--------------------------------

TITLE: Publish Dagger Container Image to Private Registry
DESCRIPTION: Shows how to publish a just-in-time container image to a private registry like Docker Hub or GitHub Container Registry. It includes Dagger Function implementations in Go, Python, and TypeScript, and command-line examples for publishing with username and environment variable-based passwords.

SOURCE: https://github.com/dagger/dagger/blob/main/docs/current_docs/cookbook/cookbook.mdx#_snippet_70

LANGUAGE: go
CODE:
```
file=./snippets/publish-image/go/main.go
```

LANGUAGE: python
CODE:
```
file=./snippets/publish-image/python/main.py
```

LANGUAGE: typescript
CODE:
```
file=./snippets/publish-image/typescript/index.ts
```

LANGUAGE: shell
CODE:
```
dagger -c 'publish docker.io user env://PASSWORD'
```

LANGUAGE: shell
CODE:
```
publish docker.io user env://PASSWORD
```

LANGUAGE: shell
CODE:
```
dagger call publish --registry=docker.io --username=user --password=env://PASSWORD
```

LANGUAGE: shell
CODE:
```
dagger -c 'publish gchr.io user env://PASSWORD'
```

LANGUAGE: shell
CODE:
```
publish gchr.io user env://PASSWORD
```

LANGUAGE: shell
CODE:
```
dagger call publish --registry=gchr.io --username=user --password=env://PASSWORD
```

--------------------------------

TITLE: GitHub Actions Workflow Configuration
DESCRIPTION: This YAML file defines a GitHub Actions workflow that triggers an agent when a 'develop' label is added to an issue. It requires repository secrets for LLM authentication (e.g., GEMINI_API_KEY) and has permissions to read issues and write pull requests.

SOURCE: https://github.com/dagger/dagger/blob/main/docs/current_docs/getting-started/quickstarts/agent/inproject.mdx#_snippet_27

LANGUAGE: yaml
CODE:
```
name: Develop Agent

on:
  issues:
    types: [labeled]

jobs:
  develop:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up Dagger
        uses: dagger/dagger-action@v5
        with:
          # Use a specific Dagger SDK version
          sdk: golang@v0.10.0
        env:
          # Provide your LLM API key as a repository secret
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
          # Provide your Dagger Cloud token if you signed up for Dagger Cloud
          DAGGER_CLOUD_TOKEN: ${{ secrets.DAGGER_CLOUD_TOKEN }}

      - name: Run develop-issue function
        run: |
          dagger call develop-issue --label "develop" --issue-number "${{ github.event.issue.number }}"
        if: contains(github.event.issue.labels.*.name, 'develop')

```

--------------------------------

TITLE: Pass GitHub PR URL to Dagger Function
DESCRIPTION: Demonstrates how to pass a GitHub pull request URL as an argument to a Dagger Function that accepts a Directory type, enabling direct testing of PR functionality.

SOURCE: https://github.com/dagger/dagger/blob/main/docs/current_docs/ci/integrations/github.mdx#_snippet_0

LANGUAGE: shell
CODE:
```
dagger call foo --directory=https://github.com/ORGANIZATION/REPOSITORY#pull/NUMBER/merge
```

--------------------------------

TITLE: Call Dagger Module from GitHub Repository with PR Branch
DESCRIPTION: Shows how to call a Dagger module hosted on GitHub, specifying a branch from a pull request. This is useful for testing specific branches of a Dagger module.

SOURCE: https://github.com/dagger/dagger/blob/main/docs/current_docs/getting-started/ci-integrations/github.mdx#_snippet_1

LANGUAGE: shell
CODE:
```
dagger call -m github.com/ORGANIZATION/REPOSITORY@pull/NUMBER/merge --help
```

--------------------------------

TITLE: Create React App with TypeScript
DESCRIPTION: Creates a new React project with TypeScript support using `create-react-app` and navigates into the project directory.

SOURCE: https://github.com/dagger/dagger/blob/main/docs/current_docs/extending/custom-applications/typescript.mdx#_snippet_1

LANGUAGE: shell
CODE:
```
npx create-react-app my-app --template typescript
cd my-app
```

--------------------------------

TITLE: Add OCI annotations to image (TypeScript)
DESCRIPTION: This Dagger Function adds OpenContainer Initiative (OCI) annotations to an image using TypeScript.

SOURCE: https://github.com/dagger/dagger/blob/main/docs/current_docs/partials/cookbook/builds/_oci-annotations.mdx#_snippet_2

LANGUAGE: typescript
CODE:
```
import * as dagger from "@dagger.io/dagger";

async function main() {
  const ctx = await dagger.connect();

  // Publish an image with OCI annotations
  await ctx.container()
    .from("alpine:latest")
    .withRegistryAuth("registry.example.com", "user", "pass")
    .withImageConfig({
      "org.opencontainers.image.created": "2023-01-01T00:00:00Z",
      "org.opencontainers.image.authors": "Alice <alice@example.com>",
    })
    .publish("registry.example.com/myimage:latest");
}

main();

```

--------------------------------

TITLE: Top-level Dagger Module for Monorepos
DESCRIPTION: Illustrates a top-level Dagger module orchestrating sub-modules for different components within a monorepo. This pattern is useful when projects have distinct requirements but share some logical dependencies.

SOURCE: https://github.com/dagger/dagger/blob/main/docs/current_docs/reference/best-practices/monorepos.mdx#_snippet_0

LANGUAGE: mermaid
CODE:
```
graph TD
    A[Top-level orchestrator module] --> B[Webapp frontend module]
    A[Top-level orchestrator module] --> C[Webapp backend module]
    A[Top-level orchestrator module] --> D[Utilities module]
    A[Top-level orchestrator module] --> E[Docs module]
```

--------------------------------

TITLE: Install Dagger TypeScript SDK
DESCRIPTION: Installs the Dagger TypeScript SDK as a development dependency using npm.

SOURCE: https://github.com/dagger/dagger/blob/main/sdk/typescript/README.md#_snippet_0

LANGUAGE: shell
CODE:
```
npm install @dagger.io/dagger --save-dev
```

--------------------------------

TITLE: Configure TypeScript IDE for Dagger modules
DESCRIPTION: Details the `tsconfig.json` configuration required for TypeScript IDEs to recognize the `@dagger.io/dagger` package, enabling type-hinting and other IDE features without separate installation.

SOURCE: https://github.com/dagger/dagger/blob/main/docs/current_docs/api/ide-integration.mdx#_snippet_9

LANGUAGE: JSON
CODE:
```
{
    "experimentalDecorators": true,
    "paths": {
      "@dagger.io/dagger": ["./sdk"]
    }
}
```

--------------------------------

TITLE: Python Dagger Function for CI Workflow Orchestration
DESCRIPTION: This Python Dagger Function demonstrates a comprehensive CI workflow. It leverages a third-party Golang module for project setup, testing, and container image building. Subsequently, it publishes the built image using the core Dagger API and then performs a vulnerability scan on the image using a third-party Trivy module, showcasing cross-language module interoperability.

SOURCE: https://github.com/dagger/dagger/blob/main/docs/current_docs/features/modules.mdx#_snippet_0

LANGUAGE: python
CODE:
```
@function
async def ci(self, source: dagger.Directory) -> str:
    # Use third-party Golang module to configure project
    go_project = dag.golang().with_project(source)

    # Run Go tests using Golang module
    await go_project.test()

    # Get container with built binaries using Golang module
    image = await go_project.build_container()

    # Push image to a registry using core Dagger API
    ref = await image.publish("ttl.sh/demoapp:1h")

    # Scan image for vulnerabilites using third-party Trivy module
    return await dag.trivy().scan_container(dag.container().from_(ref))
```

--------------------------------

TITLE: Create a TypeScript React Application
DESCRIPTION: Commands to create a new React application with a TypeScript template using 'create-react-app' and navigate into its directory.

SOURCE: https://github.com/dagger/dagger/blob/main/docs/current_docs/api/clients-sdk.mdx#_snippet_21

LANGUAGE: shell
CODE:
```
npx create-react-app my-app --template typescript
cd my-app
```

--------------------------------

TITLE: GitLab CI: Basic Kubernetes Hello World
DESCRIPTION: Example GitLab CI configuration to call a basic Dagger Function using the Kubernetes executor. This setup assumes the Dagger Engine is pre-provisioned on a Kubernetes node.

SOURCE: https://github.com/dagger/dagger/blob/main/docs/current_docs/getting-started/ci-integrations/gitlab.mdx#_snippet_2

LANGUAGE: yaml
CODE:
```
image: "alpine:latest"

stages:
  - build

jobs:
  build:
    stage: build
    tags:
      - dagger-node
    script:
      - apk add --no-cache curl
      - curl -fsSL https://raw.githubusercontent.com/dagger/dagger/main/install/install.sh | sh -s -- --use-binary
      - dagger call hello
```

--------------------------------

TITLE: GitHub Actions Integration for Dagger Cloud
DESCRIPTION: This snippet shows how to configure a GitHub Actions workflow to use the DAGGER_CLOUD_TOKEN secret for connecting to Dagger Cloud. It includes steps for creating the secret and referencing it in the workflow.

SOURCE: https://github.com/dagger/dagger/blob/main/docs/current_docs/reference/configuration/cloud.mdx#_snippet_1

LANGUAGE: YAML
CODE:
```
environment:
  DAGGER_CLOUD_TOKEN: ${{ secrets.DAGGER_CLOUD_TOKEN }}
```

--------------------------------

TITLE: Exclude Git Metadata in TypeScript
DESCRIPTION: This TypeScript code snippet demonstrates how to use the @argument decorator to ignore Git metadata, including the .git directory and .gitignore files, from Dagger operations.

SOURCE: https://github.com/dagger/dagger/blob/main/docs/current_docs/getting-started/types/directory.mdx#_snippet_7

LANGUAGE: typescript
CODE:
```
// exclude Git metadata
@argument({ ignore: [".git", "**/.gitignore"] })
```

--------------------------------

TITLE: Shared Dagger Module for Monorepos
DESCRIPTION: Depicts a single, shared Dagger automation module used by multiple projects in a monorepo. This pattern is ideal for monorepos where projects have substantial commonalities, such as multiple microservices or front-end applications.

SOURCE: https://github.com/dagger/dagger/blob/main/docs/current_docs/reference/best-practices/monorepos.mdx#_snippet_1

LANGUAGE: mermaid
CODE:
```
graph TD
    A[Shared module] --> B[Microservice 1]
    A[Shared module] --> C[Microservice 2]
    A[Shared module] --> D[Microservice 3]
```

--------------------------------

TITLE: Dagger Function with Secret Variable (Go, Python, TypeScript)
DESCRIPTION: Demonstrates how a Dagger Function can accept and utilize a secret variable, such as a GitHub personal access token, to authorize API requests. Secrets can be sourced from the host environment.

SOURCE: https://github.com/dagger/dagger/blob/main/docs/current_docs/partials/cookbook/secrets/_use-secret-variable.mdx#_snippet_0

LANGUAGE: go
CODE:
```
package main

import (
	"context"
	"dagger.io/dagger"
	"fmt"
)

func main() {
	ctx := context.Background()

	// Initialize Dagger client
	client, err := dagger.Connect(dagger.WithLogIssue(true))
	if err != nil {
		panic(err)
	}

	// Define the secret variable
	githubToken := client.Host().SecretFile("../../../cookbook/snippets/secret-variable/go/token.txt")

	// Call the GitHub API function with the secret
	output, err := client.Container().
		From("alpine").
		WithSecretVariable("GITHUB_API_TOKEN", githubToken).
		WithExec([]string{
			"sh",
			"-c",
			"echo $GITHUB_API_TOKEN"
		}).
		Stdout(ctx)

	if err != nil {
		panic(err)
	}

	fmt.Printf("GitHub API Token (from secret): %s\n", output)
}

```

LANGUAGE: python
CODE:
```
import dagger
import sys

def main():
    ctx = dagger.Config()

    # Initialize Dagger client
    client = dagger.Client(config=ctx)

    # Define the secret variable
    github_token = client.host().secret_file("../../../cookbook/snippets/secret-variable/python/token.txt")

    # Call the GitHub API function with the secret
    output = client.container().from_("alpine").with_secret_variable("GITHUB_API_TOKEN", github_token).with_exec([
        "sh",
        "-c",
        "echo $GITHUB_API_TOKEN"
    ]).stdout()

    print(f"GitHub API Token (from secret): {output}")

if __name__ == "__main__":
    main()

```

LANGUAGE: typescript
CODE:
```
import Client from "@dagger.io/dagger";

async function main() {
  const client = new Client();

  // Define the secret variable
  const githubToken = client.host.secretFile("../../../cookbook/snippets/secret-variable/typescript/token.txt");

  // Call the GitHub API function with the secret
  const output = await client.container
    .from("alpine")
    .withSecretVariable("GITHUB_API_TOKEN", githubToken)
    .withExec(["sh", "-c", "echo $GITHUB_API_TOKEN"])
    .stdout();

  console.log(`GitHub API Token (from secret): ${output}`);
}

main();

```

--------------------------------

TITLE: Dagger Common Use Cases
DESCRIPTION: Highlights common applications of Dagger, such as running workflows locally like in CI, enhancing CI with LLMs, and improving monorepo build times.

SOURCE: https://github.com/dagger/dagger/blob/main/docs/current_docs/index.mdx#_snippet_2

LANGUAGE: English
CODE:
```
Run workflows in your local development environment, exactly as they run in remote CI.
Enhance existing CI pipelines with LLMs for code review, tests and feedback.
Improve build times, testing and dependency management in monorepos.
```

--------------------------------

TITLE: Install Dagger TypeScript SDK
DESCRIPTION: Installs the Dagger TypeScript SDK using npm or yarn. This SDK requires TypeScript 5.0 or later and supports Node.js and Bun.

SOURCE: https://github.com/dagger/dagger/blob/main/docs/current_docs/extending/custom-applications/typescript.mdx#_snippet_0

LANGUAGE: shell
CODE:
```
// using npm
npm install @dagger.io/dagger@latest --save-dev

// using yarn
yarn add @dagger.io/dagger --dev
```

--------------------------------

TITLE: Initialize Dagger TypeScript Module and Install Google Cloud Run Dependency
DESCRIPTION: Commands to create a new Dagger module with the TypeScript SDK and install the `google-cloud-run` Dagger module as a dependency. This sets up the project to call the module from TypeScript code.

SOURCE: https://github.com/dagger/dagger/blob/main/docs/current_docs/ci/integrations/google-cloud-run.mdx#_snippet_3

LANGUAGE: shell
CODE:
```
dagger init --name=my-module --sdk=typescript --source=./dagger
```

LANGUAGE: shell
CODE:
```
dagger install github.com/vvaswani/daggerverse/google-cloud-run@v0.1.5
```

--------------------------------

TITLE: Configure Dagger TypeScript SDK for Node.js Runtime
DESCRIPTION: Demonstrates how to explicitly set the Dagger TypeScript SDK runtime to Node.js in `package.json`, including specifying a particular version. Node.js is also the default runtime if omitted.

SOURCE: https://github.com/dagger/dagger/blob/main/docs/current_docs/configuration/modules.mdx#_snippet_1

LANGUAGE: json
CODE:
```
  "dagger": {
    "runtime": "node"
  }
```

LANGUAGE: json
CODE:
```
  "dagger": {
    "runtime": "node@20.15.0"
  }
```

--------------------------------

TITLE: Execute Publish Workflow
DESCRIPTION: Runs the application's tests, builds, and publishes it as a container image to the ttl.sh container registry.

SOURCE: https://github.com/dagger/dagger/blob/main/docs/current_docs/getting-started/quickstarts/ci/index.mdx#_snippet_10

LANGUAGE: shell
CODE:
```
publish
```

--------------------------------

TITLE: Add TypeScript Package
DESCRIPTION: Illustrates adding TypeScript packages for different runtimes like Node.js, Bun, and Deno using their respective package managers.

SOURCE: https://github.com/dagger/dagger/blob/main/docs/current_docs/extending/modules/packages.mdx#_snippet_2

LANGUAGE: shell
CODE:
```
npm install pm2
```

LANGUAGE: shell
CODE:
```
bun install pm2
```

LANGUAGE: shell
CODE:
```
deno add jsr:@celusion/simple-validation
```

--------------------------------

TITLE: GitLab Runner DaemonSet Configuration
DESCRIPTION: Example Kubernetes DaemonSet configuration for a GitLab Runner that is set up to work with Dagger. This includes node selectors and tolerations to ensure it runs on appropriate nodes.

SOURCE: https://github.com/dagger/dagger/blob/main/docs/current_docs/getting-started/ci-integrations/gitlab.mdx#_snippet_5

LANGUAGE: yaml
CODE:
```
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: gitlab-runner
  namespace: gitlab-runner
spec:
  selector:
    matchLabels:
      app: gitlab-runner
  template:
    metadata:
      labels:
        app: gitlab-runner
    spec:
      tolerations:
        - key: "dagger-node"
          operator: "Exists"
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
              - matchExpressions:
                  - key: "dagger-node"
                    operator: "Exists"
      containers:
        - name: gitlab-runner
          image: gitlab/gitlab-runner:latest
          args:
            - "run"
          env:
            - name: "CI_SERVER_URL"
              value: "YOUR-GITLAB-URL"
            - name: "RUNNER_TOKEN"
              value: "YOUR-GITLAB-RUNNER-TOKEN-REFERENCE"
            - name: "DOCKER_HOST"
              value: "tcp://docker:2376"
            - name: "DOCKER_TLS_CERTDIR"
              value: "/certs"
          volumeMounts:
            - name: "docker-sock"
              mountPath: "/var/run/docker.sock"
            - name: "certs"
              mountPath: "/certs"
      volumes:
        - name: "docker-sock"
          hostPath:
            path: "/var/run/docker.sock"
        - name: "certs"
          secret:
            secretName: "gitlab-runner-certs"

```

--------------------------------

TITLE: Chaining Dagger Functions (TypeScript)
DESCRIPTION: Example of chaining Dagger Functions in TypeScript, utilizing a Daggerverse module to build a Go project and subsequently opening an interactive terminal in the build directory.

SOURCE: https://github.com/dagger/dagger/blob/main/docs/current_docs/extending/modules/module-dependencies.mdx#_snippet_9

LANGUAGE: typescript
CODE:
```
import { dag, func, Directory, Container } from "@dagger.io/dagger"

@func()
async greeting(): Promise<string> {
  return await dag.hello().hello()
}

// Build a Go project using a Dagger module from the Daggerverse
async function buildGoProject(src: Directory, buildArgs: string[]): Promise<Directory> {
  const golang = dag.get("github.com/kpenfound/dagger-modules/golang").go()
  return golang.build({ args: buildArgs }, src)
}

// Open a terminal in the build directory
@func()
async runInBuild(src: Directory, buildArgs: string[]): Promise<Container> {
  const builtDir = await buildGoProject(src, buildArgs)
  return dag.container().from_(builtDir).terminal()
}

```

--------------------------------

TITLE: Test Dagger Module with GitHub PR URL
DESCRIPTION: Illustrates how to test a Dagger module located within a GitHub repository by invoking it with the corresponding pull request URL, allowing for branch-specific module testing.

SOURCE: https://github.com/dagger/dagger/blob/main/docs/current_docs/ci/integrations/github.mdx#_snippet_1

LANGUAGE: shell
CODE:
```
dagger call -m github.com/ORGANIZATION/REPOSITORY@pull/NUMBER/merge --help
```

--------------------------------

TITLE: Build Multi-Arch Image (TypeScript)
DESCRIPTION: This Dagger Function in TypeScript builds a single Docker image that supports multiple CPU architectures using native emulation.

SOURCE: https://github.com/dagger/dagger/blob/main/docs/current_docs/partials/cookbook/builds/_multi-arch.mdx#_snippet_2

LANGUAGE: typescript
CODE:
```
import dag from "@dagger.io/dagger";

async function main() {
  // initialize Dagger client
  const client = await dag.connect(console.log);

  // get Dagger client
  const cli = client.dagger();

  // define the source code directory
  const src = cli.host().directory(".");

  // build the multi-arch image
  const image = await cli.container().build(src, {
    platformMapping: {
      "linux/amd64": "linux/amd64",
      "linux/arm64": "linux/arm64",
    },
  });

  // print the image ID
  const imageID = await image.id();
  console.log(`Built image ID: ${imageID}`);
}

main();

```

--------------------------------

TITLE: Mount Directory to Container (TypeScript)
DESCRIPTION: Mounts a specified directory to the /src path in a Dagger container using TypeScript. This function accepts a Directory argument, which can be a local filesystem directory or a remote Git repository. Ensure SSH authentication is configured for private Git repositories.

SOURCE: https://github.com/dagger/dagger/blob/main/docs/current_docs/partials/cookbook/filesystems/_mount-copy-directory.mdx#_snippet_2

LANGUAGE: typescript
CODE:
```
import Client from "@dagger.io/dagger";

async function main() {
  const client = new Client();

  // Mount a local directory to /src
  const container = client.container().mount(
    "./myapp/", // Path to the local directory
    "/src",      // Destination path in the container
  );

  // You can now use the container, e.g., run commands in it
  // For example, to list the contents of /src:
  // const entries = await container.directory("/src").entries();
  // console.log(entries);
}

main();

```

--------------------------------

TITLE: Shell Commands to Clone Go Examples Repository
DESCRIPTION: These shell commands are used to clone the official Go examples repository from GitHub and then navigate into the newly created directory. This sets up the local environment for subsequent Dagger GraphQL queries that interact with the Go project.

SOURCE: https://github.com/dagger/dagger/blob/main/docs/current_docs/api/internals.mdx#_snippet_9

LANGUAGE: shell
CODE:
```
git clone https://github.com/golang/example
cd example
```

--------------------------------

TITLE: Clone Git Repository with Dagger
DESCRIPTION: Clones a Git repository into a container at the specified reference. The repository is copied to the `/src` path in the container. Includes examples for Go, Python, TypeScript and PHP.

SOURCE: https://github.com/dagger/dagger/blob/main/docs/current_docs/partials/cookbook/filesystems/_clone-remote-git.mdx#_snippet_0

LANGUAGE: Go
CODE:
```
package main

import (
	"context"
	"fmt"

	"dagger.io/dagger"
)

func main() {
	ctx := context.Background()

	// initialize Dagger client
	client, err := dagger.Connect(ctx)
	if err != nil {
		panic(err)
	}
	defer client.Close()

	// define repository and reference
	repository := "https://github.com/dagger/dagger"
	ref := "196f232a4d6b2d1d3db5f5e040cf20b6a76a76c5"

	// clone repository at reference
	src := client.Git(repository, dagger.GitOpts{KeepGitDir: false}).Commit(ref).Tree()

	// create a base container
	container := client.Container().From("ubuntu:22.04")

	// mount cloned repository into the container at /src
	container = container.WithDirectory("/src", src)

	// verify the cloned repository
	result, err := container.WithExec([]string{"ls", "-l", "/src"}).Stdout(ctx)
	if err != nil {
		panic(err)
	}

	fmt.Println(result)
}
```

LANGUAGE: Python
CODE:
```
import dagger

async def main():
    async with dagger.Connection() as client:
        # Define the repository and reference
        repository = "https://github.com/dagger/dagger"
        ref = "196f232a4d6b2d1d3db5f5e040cf20b6a76a76c5"

        # Clone the repository at the specified reference
        src = client.git(repository, keep_git_dir=False).commit(ref).tree()

        # Create a base container
        container = client.container().from_("ubuntu:22.04")

        # Mount the cloned repository into the container at /src
        container = container.with_directory("/src", src)

        # Verify the cloned repository
        result = await container.with_exec(["ls", "-l", "/src"]).stdout()

        print(result)

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

LANGUAGE: TypeScript
CODE:
```
import { connect } from "@dagger.io/dagger"

async function main() {
  // initialize Dagger client
  await connect(async (client) => {
    // define repository and reference
    const repository = "https://github.com/dagger/dagger"
    const ref = "196f232a4d6b2d1d3db5f5e040cf20b6a76a76c5"

    // clone repository at reference
    const src = client.git(repository, { keepGitDir: false }).commit(ref).tree()

    // create a base container
    const container = client.container().from("ubuntu:22.04")

    // mount cloned repository into the container at /src
    container = container.withDirectory("/src", src)

    // verify the cloned repository
    const result = await container
      .withExec(["ls", "-l", "/src"])
      .stdout()

    console.log(result)
  })
}

main()
```

LANGUAGE: PHP
CODE:
```
<?php

namespace Dagger\CloneGitRepository;

use Dagger\Client;

class MyModule {
  public function clone(string $repository, string $ref): string
  {
    $client = new Client();

    // clone repository at reference
    $src = $client->git($repository, ['keepGitDir' => false])->commit($ref)->tree();

    // create a base container
    $container = $client->container()->from("ubuntu:22.04");

    // mount cloned repository into the container at /src
    $container = $container->withDirectory("/src", $src);

    // verify the cloned repository
    return $container->withExec(["ls", "-l", "/src"])->stdout();
  }
}

```

--------------------------------

TITLE: Request and save file from HTTP/HTTPS to container (Go, Python, TypeScript)
DESCRIPTION: This Dagger Function demonstrates how to fetch a file from a given HTTP/HTTPS URL and save it within a container.

SOURCE: https://github.com/dagger/dagger/blob/main/docs/current_docs/cookbook/cookbook.mdx#_snippet_28

LANGUAGE: go
CODE:
```
file=./snippets/read-file-http/go/main.go
```

LANGUAGE: python
CODE:
```
file=./snippets/read-file-http/python/main.py
```

LANGUAGE: typescript
CODE:
```
file=./snippets/read-file-http/typescript/index.ts
```

--------------------------------

TITLE: Import Dagger SDK in TypeScript
DESCRIPTION: Demonstrates how to import the connect function from the locally linked Dagger TypeScript SDK in a TypeScript file.

SOURCE: https://github.com/dagger/dagger/blob/main/sdk/typescript/README.md#_snippet_6

LANGUAGE: typescript
CODE:
```
import { connect } from "@dagger.io/dagger"

```

--------------------------------

TITLE: TypeScript Dagger Build Program
DESCRIPTION: A TypeScript program that uses the Dagger SDK to test and build a Node.js application against multiple Node.js versions (16, 18, 20). It downloads container images for each version and runs tests.

SOURCE: https://github.com/dagger/dagger/blob/main/docs/current_docs/extending/custom-applications/typescript.mdx#_snippet_2

LANGUAGE: typescript
CODE:
```
import Dagger from "@dagger.io/dagger"

const client = new Dagger()

// test/build against multiple Node.js versions
const versions = [16, 18, 20]

for (const version of versions) {
  const node = client.node(version)
  const src = client.hostFS()

  const build = node.build(
    src,
    [
      `npm install`,
      `npm run build`,
    ],
    {
      name: `build-node-${version}`,
    }
  )

  build.export(`./build-node-${version}`)
}

```

--------------------------------

TITLE: Start and Use NGINX Service Endpoint in TypeScript
DESCRIPTION: This TypeScript code snippet demonstrates how to start an NGINX service, retrieve its endpoint, and send an HTTP request to it. It requires the Dagger SDK for TypeScript.

SOURCE: https://github.com/dagger/dagger/blob/main/docs/current_docs/partials/cookbook/services/_use-service-endpoints.mdx#_snippet_2

LANGUAGE: typescript
CODE:
```
import Client from "@dagger.io/dagger";

async function main() {
  const client = new Client();

  // Start an NGINX service on host port 80
  const nginx = client.container
    .from("nginx:alpine")
    .withExposedPort(80)
    .asService();

  // Get the service endpoint
  const webSvcEndpoint = nginx.endpoint;

  // Send a request to the service endpoint
  const resp = await client.container
    .from("curlimages/curl:latest")
    .withServiceBinding("/web", nginx)
    .withNewFile("/cmd.sh", "curl http://web/")
    .exec({ cmd: ["sh", "/cmd.sh"] })
    .stdout();

  console.log(`Response from service: ${resp}`);
}

main();

```

--------------------------------

TITLE: Copy Remote GitHub File to Dagger Container
DESCRIPTION: Provides an example of copying a file from a public GitHub repository directly into a Dagger container. This is useful for incorporating remote assets into container builds.

SOURCE: https://github.com/dagger/dagger/blob/main/docs/current_docs/cookbook/cookbook.mdx#_snippet_22

LANGUAGE: shell
CODE:
```
dagger -c 'copy-file https://github.com/dagger/dagger.git#main:README.md'
```

LANGUAGE: shell
CODE:
```
copy-file https://github.com/dagger/dagger.git#main:README.md
```

LANGUAGE: shell
CODE:
```
dagger call copy-file --f=https://github.com/dagger/dagger.git#main:README.md
```

--------------------------------

TITLE: Exclude Node.js Dependencies in TypeScript
DESCRIPTION: This TypeScript code snippet demonstrates how to use the @argument decorator to ignore Node.js dependency directories, specifically node_modules, from Dagger operations.

SOURCE: https://github.com/dagger/dagger/blob/main/docs/current_docs/getting-started/types/directory.mdx#_snippet_10

LANGUAGE: typescript
CODE:
```
// exclude Node.js dependencies
@argument({ ignore: ["**/node_modules"] })
```

--------------------------------

TITLE: Build Output Directory Structure
DESCRIPTION: Displays the directory structure of the build outputs for each Node.js version after the Dagger program has been executed. Each version has a `build-node-XX` folder containing the static assets.

SOURCE: https://github.com/dagger/dagger/blob/main/docs/current_docs/extending/custom-applications/typescript.mdx#_snippet_4

LANGUAGE: shell
CODE:
```
tree -L 2 -d build-*
build-node-16
└── static
    ├── css
    ├── js
    └── media
build-node-18
└── static
    ├── css
    ├── js
    └── media
build-node-20
└── static
    ├── css
    ├── js
    └── media
```

--------------------------------

TITLE: Python CI Workflow with Go and Trivy Modules
DESCRIPTION: Demonstrates a Python Dagger Function that utilizes a Go module for project configuration and testing, and a Trivy module for vulnerability scanning. It shows how to build a container, publish it, and then scan it using different Dagger modules.

SOURCE: https://github.com/dagger/dagger/blob/main/docs/current_docs/introduction/features/reusability.mdx#_snippet_0

LANGUAGE: Python
CODE:
```
@function
async def ci(self, source: dagger.Directory) -> str:
    # Use third-party Golang module to configure project
    go_project = dag.golang().with_project(source)

    # Run Go tests using Golang module
    await go_project.test()

    # Get container with built binaries using Golang module
    image = await go_project.build_container()

    # Push image to a registry using core Dagger API
    ref = await image.publish("ttl.sh/demoapp:1h")

    # Scan image for vulnerabilites using third-party Trivy module
    return await dag.trivy().scan_container(dag.container().from_(ref))
```

--------------------------------

TITLE: Dagger Remote Module Reference Schemes
DESCRIPTION: Details the supported protocols and schemes for referencing Dagger modules in remote repositories, including authentication and monorepo support.

SOURCE: https://github.com/dagger/dagger/blob/main/docs/current_docs/extending/modules/remote-repositories.mdx#_snippet_1

LANGUAGE: APIDOC
CODE:
```
Remote Modules:

| Protocol | Scheme            | Authentication         | Example                                         |
|----------|-------------------|------------------------|-------------------------------------------------|
| HTTP(S)  | Go-like ref style | Git credential manager | `github.com/username/repo[/subdir][@version]`  |
| HTTP(S)  | Git HTTP style    | Git credential manager | `https://github.com/username/repo.git[/subdir][@version]` |
| SSH      | SCP-like          | SSH keys               | `git@github.com:username/repo.git[/subdir][@version]`     |
| SSH      | Explicit SSH      | SSH keys               | `ssh://git@github.com/username/repo.git[/subdir][@version]` |

Additional Options:
- Optional extension: `.git` extension is optional for HTTP/SSH refs (except GitLab private repos).
- Monorepo support: Append `/subpath` to access a subdirectory.
- Version specification: Append `@version` (tag, branch, or commit hash). Defaults to the default branch if omitted.
```

--------------------------------

TITLE: TypeScript Secrets Example
DESCRIPTION: Shows how to manage and utilize secrets in a TypeScript Dagger pipeline. This snippet provides the TypeScript code for secret integration.

SOURCE: https://github.com/dagger/dagger/blob/main/docs/current_docs/introduction/features/secrets.mdx#_snippet_2

LANGUAGE: typescript
CODE:
```
import Client from "@dagger.io/dagger";

async function main() {
  // Initialize Dagger client
  const client = new Client();

  // Get GitHub token from secret provider
  const githubToken = client.secretFile().id; // Replace with actual secret retrieval

  // Use the secret in a Dagger command
  const container = client.container().from("alpine");
  const secretContainer = container.withSecret("GITHUB_TOKEN", githubToken);
  const result = await secretContainer.exec({
    command: ["sh", "-c", "echo $GITHUB_TOKEN"],
  });
  console.log(await result.stdout());

  console.log("Secret used successfully");
}

main();
```

--------------------------------

TITLE: Copy GitHub Repository to Container and List Contents with Dagger
DESCRIPTION: Illustrates copying a public GitHub repository (dagger/dagger) to the container's /src directory, excluding all files except Markdown. After copying, it lists the contents of the /src directory within the container.

SOURCE: https://github.com/dagger/dagger/blob/main/docs/current_docs/cookbook/cookbook.mdx#_snippet_35

LANGUAGE: shell
CODE:
```
dagger -c 'copy-directory-with-exclusions https://github.com/dagger/dagger#main | directory /src | entries'
```

LANGUAGE: shell
CODE:
```
copy-directory-with-exclusions https://github.com/dagger/dagger#main | directory /src | entries
```

LANGUAGE: shell
CODE:
```
dagger call \
      copy-directory-with-exclusions --source=https://github.com/dagger/dagger#main \
      directory --path=/src \
      entries
```

--------------------------------

TITLE: Multi-Stage Build in TypeScript
DESCRIPTION: Shows a multi-stage build process using Dagger in TypeScript. This function defines and executes build stages.

SOURCE: https://github.com/dagger/dagger/blob/main/docs/current_docs/partials/cookbook/builds/_multi-stage.mdx#_snippet_2

LANGUAGE: typescript
CODE:
```
import Client from "@dagger.io/dagger";

async function main() {
  // Initialize Dagger client
  const client = new Client({ logOutput: process.stderr });

  // Define the source code directory
  const src = client.host.directory("../../../cookbook/snippets/builds/multi-stage-build/typescript");

  // Define the build image
  const container = client.container.build(src);

  // Publish the image to a registry
  const ref = await container.publish("docker.io/my-repo/my-image:latest");

  console.log(ref);
}

main();

```

--------------------------------

TITLE: Dagger Monorepo Orchestration Pattern
DESCRIPTION: Illustrates a monorepo structure where a top-level Dagger orchestrator module manages multiple independent sub-modules, each representing a different component like webapp frontend, backend, utilities, or documentation. This pattern is suitable for monorepos with diverse project types and inter-dependencies, allowing for clear separation and dependency modeling.

SOURCE: https://github.com/dagger/dagger/blob/main/docs/current_docs/api/module-structure.mdx#_snippet_8

LANGUAGE: mermaid
CODE:
```
graph TD
    A[Top-level orchestrator module] --> B[Webapp frontend module]
    A[Top-level orchestrator module] --> C[Webapp backend module]
    A[Top-level orchestrator module] --> D[Utilities module]
    A[Top-level orchestrator module] --> E[Docs module]
```
