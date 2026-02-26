import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { runRalph, type RalphShell } from "./ralph.ts";

const tempDirs: string[] = [];

function createTempRepo(): string {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ralph-test-"));
	tempDirs.push(dir);
	return dir;
}

afterEach(() => {
	for (const dir of tempDirs.splice(0, tempDirs.length)) {
		fs.rmSync(dir, { recursive: true, force: true });
	}
});

describe("runRalph", () => {
	it("does not fail CI loop when repo has no apps directory", async () => {
		const repoRoot = createTempRepo();
		fs.writeFileSync(
			path.join(repoRoot, "tasks.json"),
			JSON.stringify([
				{
					id: "1",
					title: "Task",
					description: "Desc",
					todo: ["todo"],
					dependencies: [],
				},
			]),
		);

		const shell: RalphShell = {
			getRepoRoot: vi.fn(async () => repoRoot),
			branchExists: vi.fn(async () => false),
			gitLogRange: vi.fn(async () => ""),
			gitLogRecent: vi.fn(async () => "recent"),
			runCheck: vi.fn(async () => ({
				stdout: "",
				stderr: "",
				exitCode: 0,
				ok: true,
			})),
			runOpencode: vi.fn(async () => {}),
			continueOpencode: vi.fn(async () => {}),
		};

		const logger = { log: vi.fn(), error: vi.fn() };

		await expect(
			runRalph({
				taskId: "1",
				repoRoot,
				shell,
				logger,
				maxFixRetries: 1,
			}),
		).resolves.toBeUndefined();

		expect(shell.continueOpencode).not.toHaveBeenCalled();
		expect(shell.runCheck).not.toHaveBeenCalled();
	});
});
