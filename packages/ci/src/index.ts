import { dag, Container, Directory, object, func } from '@dagger.io/dagger'

@object()
export class AaminiCi {
	@func()
	base(source: Directory): Container {
		return (
			dag
				.container()
				.from('node:22-slim')
				// Install pnpm
				.withExec(['corepack', 'enable', 'pnpm'])
				// Mount source code
				.withDirectory('/app', source, { exclude: ['node_modules', '.git'] })
				.withWorkdir('/app')
		)
		// Install dependencies
		// .withExec(["pnpm", "install", "--frozen-lockfile"]);
	}

	/** Creates a base container with environment variables for Turbo */
	// @func()
	// baseWithTurbo(
	//   source: Directory,
	//   turboToken?: Secret,
	//   turboTeam?: string
	// ): Container {
	//   let container = this.base(source);

	//   if (turboToken) {
	//     container = container.withSecretVariable("TURBO_TOKEN", turboToken);
	//   }

	//   if (turboTeam) {
	//     container = container.withEnvVariable("TURBO_TEAM", turboTeam);
	//   }

	//   return container;
	// }

	// /**
	//  * Runs quality checks: format, typecheck, lint, and unit tests
	//  */
	// @func()
	// async qualityChecks(
	//   source: Directory,
	//   turboToken?: Secret,
	//   turboTeam?: string
	// ): Promise<string> {
	//   return await this.baseWithTurbo(source, turboToken, turboTeam)
	//     .withExec([
	//       "pnpm",
	//       "turbo",
	//       "run",
	//       "format",
	//       "typecheck",
	//       "lint",
	//       "test:unit",
	//     ])
	//     .stdout();
	// }

	// /**
	//  * Runs integration tests with Playwright
	//  */
	// @func()
	// async integrationTests(
	//   source: Directory,
	//   turboToken?: Secret,
	//   turboTeam?: string
	// ): Promise<string> {
	//   return await this.baseWithTurbo(source, turboToken, turboTeam)
	//     // Install Playwright browsers
	//     .withExec(["pnpm", "dlx", "playwright", "install", "--with-deps"])
	//     // Run integration tests
	//     .withExec(["pnpm", "test:integration"])
	//     .stdout();
	// }

	// /**
	//  * Finds apps that have changed based on git diff
	//  */
	// @func()
	// async findChangedApps(
	//   source: Directory,
	//   base?: string,
	//   allApps?: boolean
	// ): Promise<string[]> {
	//   const filter = allApps
	//     ? "{./apps/*}"
	//     : base
	//       ? `{./apps/*}[${base}...HEAD]`
	//       : "{./apps/*}";

	//   const result = await this.base(source)
	//     .withExec([
	//       "pnpm",
	//       "turbo",
	//       "build",
	//       `--filter=${filter}`,
	//       "--dry=json",
	//     ])
	//     .stdout();

	//   try {
	//     const turboOutput = JSON.parse(result);
	//     return turboOutput.packages || [];
	//   } catch {
	//     console.warn("Failed to parse Turbo output, returning empty array");
	//     return [];
	//   }
	// }

	// /**
	//  * Deploys an app to Vercel and returns the deployment URL
	//  */
	// @func()
	// async deployToVercel(
	//   source: Directory,
	//   app: string,
	//   vercelToken: Secret,
	//   turboTeam: string,
	//   isProd?: boolean,
	//   branchName?: string,
	//   commitSha?: string
	// ): Promise<string> {
	//   let container = this.base(source)
	//     .withSecretVariable("VERCEL_TOKEN", vercelToken)
	//     .withEnvVariable("VERCEL_ORG_ID", turboTeam)
	//     .withWorkdir(`/app/apps/${app}`)
	//     // Install Vercel CLI globally
	//     .withExec(["pnpm", "i", "-g", "vercel"]);

	//   // Link the project
	//   container = container.withExec([
	//     "vercel",
	//     "link",
	//     "--yes",
	//     "--repo",
	//     "--token=$VERCEL_TOKEN",
	//     `--scope=${turboTeam}`,
	//   ]);

	//   // Build deploy command
	//   const deployArgs = [
	//     "vercel",
	//     "--yes",
	//     "--token=$VERCEL_TOKEN",
	//     `--scope=${turboTeam}`,
	//   ];

	//   if (isProd) {
	//     deployArgs.push("--prod");
	//   }

	//   if (branchName) {
	//     deployArgs.push(`-m`, `githubCommitRef=feature/${branchName}`);
	//   }

	//   if (commitSha) {
	//     deployArgs.push(`-m`, `githubCommitSha=${commitSha}`);
	//   }

	//   deployArgs.push(`-m`, `githubDeployment=1`);

	//   // Deploy and capture URL
	//   const output = await container.withExec(deployArgs).stdout();

	//   // The URL is on the last line
	//   const lines = output.trim().split("\n");
	//   const url = lines[lines.length - 1].trim();

	//   return url;
	// }

	// /**
	//  * Runs E2E tests for an app against a deployed URL
	//  */
	// @func()
	// async e2eTests(
	//   source: Directory,
	//   app: string,
	//   baseUrl: string,
	//   updateSnapshots?: boolean,
	//   bypassSecret?: Secret
	// ): Promise<Container> {
	//   // Use Playwright container for E2E tests
	//   let container = dag
	//     .container()
	//     .from("mcr.microsoft.com/playwright:v1.55.1-noble")
	//     // Install Node and pnpm
	//     .withExec(["corepack", "enable"])
	//     .withExec(["corepack", "prepare", "pnpm@10.17.1", "--activate"])
	//     // Mount source
	//     .withDirectory("/app", source, { exclude: ["node_modules", ".git"] })
	//     .withWorkdir("/app")
	//     // Install dependencies
	//     .withExec(["pnpm", "install", "--frozen-lockfile"])
	//     // Set base URL and working directory for the app
	//     .withEnvVariable("BASE_URL", baseUrl)
	//     .withWorkdir(`/app/apps/${app}`);

	//   // Add bypass secret if provided
	//   if (bypassSecret) {
	//     container = container.withSecretVariable(
	//       "VERCEL_AUTOMATION_BYPASS_SECRET",
	//       bypassSecret
	//     );
	//   }

	//   // Run E2E tests (with or without update flag)
	//   const e2eCommand = updateSnapshots ? "e2e:update" : "e2e";
	//   container = container.withExec(["pnpm", e2eCommand]);

	//   return container;
	// }

	// /**
	//  * Exports E2E test screenshots from a container
	//  */
	// @func()
	// async exportScreenshots(
	//   e2eContainer: Container,
	//   app: string
	// ): Promise<Directory> {
	//   return e2eContainer.directory(`/app/apps/${app}/e2e`);
	// }

	// /**
	//  * Exports Playwright test report from a container
	//  */
	// @func()
	// async exportReport(e2eContainer: Container, app: string): Promise<Directory> {
	//   return e2eContainer.directory(`/app/apps/${app}/playwright-report`);
	// }

	// /**
	//  * Runs the complete E2E workflow for all changed apps
	//  */
	// @func()
	// async fullE2e(
	//   source: Directory,
	//   vercelToken: Secret,
	//   turboTeam: string,
	//   base?: string,
	//   updateSnapshots?: boolean,
	//   bypassSecret?: Secret,
	//   isProd?: boolean,
	//   branchName?: string,
	//   commitSha?: string
	// ): Promise<string> {
	//   // Find changed apps
	//   const apps = await this.findChangedApps(source, base, updateSnapshots);

	//   if (apps.length === 0) {
	//     return "No apps changed, skipping E2E tests";
	//   }

	//   const results: string[] = [];

	//   // Process each app
	//   for (const app of apps) {
	//     try {
	//       // Deploy to Vercel
	//       const url = await this.deployToVercel(
	//         source,
	//         app,
	//         vercelToken,
	//         turboTeam,
	//         isProd,
	//         branchName,
	//         commitSha
	//       );

	//       console.log(`Deployed ${app} to ${url}`);

	//       // Run E2E tests
	//       const e2eContainer = await this.e2eTests(
	//         source,
	//         app,
	//         url,
	//         updateSnapshots,
	//         bypassSecret
	//       );

	//       await e2eContainer.stdout();

	//       results.push(`✓ ${app}: E2E tests passed`);
	//     } catch (error) {
	//       results.push(`✗ ${app}: E2E tests failed - ${error}`);
	//       throw error; // Re-throw to fail the pipeline
	//     }
	//   }

	//   return results.join("\n");
	// }

	// /**
	//  * Main CI entry point - runs all checks and tests
	//  */
	// @func()
	// async ci(
	//   source: Directory,
	//   turboToken?: Secret,
	//   turboTeam?: string,
	//   vercelToken?: Secret,
	//   bypassSecret?: Secret,
	//   base?: string,
	//   updateSnapshots?: boolean,
	//   isProd?: boolean,
	//   branchName?: string,
	//   commitSha?: string
	// ): Promise<string> {
	//   const results: string[] = [];

	//   // Run quality checks and integration tests in parallel
	//   try {
	//     const [qualityResult, integrationResult] = await Promise.all([
	//       this.qualityChecks(source, turboToken, turboTeam),
	//       this.integrationTests(source, turboToken, turboTeam),
	//     ]);

	//     results.push("✓ Quality checks passed");
	//     results.push("✓ Integration tests passed");
	//   } catch (error) {
	//     results.push(`✗ Quality/Integration checks failed: ${error}`);
	//     throw error;
	//   }

	//   // Run E2E tests if Vercel token is provided
	//   if (vercelToken && turboTeam) {
	//     try {
	//       const e2eResult = await this.fullE2e(
	//         source,
	//         vercelToken,
	//         turboTeam,
	//         base,
	//         updateSnapshots,
	//         bypassSecret,
	//         isProd,
	//         branchName,
	//         commitSha
	//       );
	//       results.push(e2eResult);
	//     } catch (error) {
	//       results.push(`✗ E2E tests failed: ${error}`);
	//       throw error;
	//     }
	//   } else {
	//     results.push("⊘ Skipping E2E tests (Vercel credentials not provided)");
	//   }

	//   return results.join("\n\n");
	// }

	// /**
	//  * Quick verification - runs quality checks only (useful for pre-commit hooks)
	//  */
	// @func()
	// async verify(
	//   source: Directory,
	//   turboToken?: Secret,
	//   turboTeam?: string
	// ): Promise<string> {
	//   return await this.qualityChecks(source, turboToken, turboTeam);
	// }
}
