"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const core_1 = require("@actions/core");
const github_1 = require("@actions/github");
const semver_1 = require("semver");
const utils_1 = require("./utils");
const SNYK_UPGRADE_PR_TITLE_REGEXP = /\[Snyk\].+?[Uu]pgrade (.+?) from (.+?) to (.+?)$/;
const SNYK_BRANCH_REGEXP = /^CondeNast:snyk-(?:fix|upgrade)/;
const run = async () => {
    const token = core_1.getInput("token") || process.env.GITHUB_TOKEN;
    if (!token)
        throw new Error("GitHub token not found");
    const [owner, repo] = (process.env.GITHUB_REPOSITORY || "").split("/");
    const octokit = github_1.getOctokit(token);
    const ignoreStatusChecks = core_1.getInput("ignore-status-checks");
    const addLabels = utils_1.addLabelsToPR.bind(null, octokit, owner, repo);
    const tryAutoMerge = utils_1.tryAutoMergePR.bind(null, octokit, owner, repo);
    const autoApprove = utils_1.autoApprovePR.bind(null, octokit, owner, repo);
    const prs = await octokit.pulls.list({ owner, repo, state: "open" });
    core_1.info(`Found ${prs.length} PRs`);
    for (const pr of prs) {
        core_1.info(`${pr.number}:${pr.title}`);
    }
    // Is this really a Snyk upgrade PR?
    // - has [Snyk] in the title
    // - head commit by Snyk bot
    const openSynkPrs = prs.data.filter((pr) => pr.title.startsWith("[Snyk]") && pr.head.label.match(SNYK_BRANCH_REGEXP));
    core_1.info(`Found ${openSynkPrs.length} open Snyk PRs`);
    for await (const pr of openSynkPrs) {
        core_1.info(`Working on Synk PR...#${pr.number}:${pr.title}`);
        const lastCommitHash = pr._links.statuses.href.split("/").pop() || "";
        // Abort if PR has not passed checks or have success status
        if (!ignoreStatusChecks) {
            const checkRuns = await octokit.checks.listForRef({ owner, repo, ref: lastCommitHash });
            const allChecksHaveSucceeded = checkRuns.data.check_runs.every((run) => run.conclusion === "success" || run.conclusion === "skipped");
            if (!allChecksHaveSucceeded) {
                continue;
            }
            const statuses = await octokit.repos.listCommitStatusesForRef({
                owner,
                repo,
                ref: lastCommitHash,
            });
            const uniqueStatuses = statuses.data.filter((item, index, self) => self.map((i) => i.context).indexOf(item.context) === index);
            const allStatusesHaveSucceeded = uniqueStatuses.every((run) => run.state === "success");
            if (!allStatusesHaveSucceeded) {
                continue;
            }
        }
        let diffType = "";
        const matches = pr.title.match(SNYK_UPGRADE_PR_TITLE_REGEXP);
        if (matches) {
            let pkgName = matches[1];
            let from = semver_1.coerce(matches[2]);
            let to = semver_1.coerce(matches[3]);
            if (from === null || to === null)
                continue;
            diffType = semver_1.diff(from, to);
        }
        if (diffType === "major") {
            await addLabels(pr.number, core_1.getInput("labels-major"));
            if (core_1.getInput("auto-label") || core_1.getInput("auto-label-major"))
                await addLabels(pr.number, "major");
            if (core_1.getInput("merge") || core_1.getInput("merge-major"))
                await tryAutoMerge(pr.number, pr.title);
            if (core_1.getInput("approve") || core_1.getInput("approve-major"))
                await autoApprove(pr.number);
        }
        else if (diffType === "premajor") {
            await addLabels(pr.number, core_1.getInput("labels-premajor"));
            if (core_1.getInput("auto-label") || core_1.getInput("auto-label-premajor"))
                await addLabels(pr.number, "premajor");
            if (core_1.getInput("merge") || core_1.getInput("merge-premajor"))
                await tryAutoMerge(pr.number, pr.title);
            if (core_1.getInput("approve") || core_1.getInput("approve-premajor"))
                await autoApprove(pr.number);
        }
        else if (diffType === "minor") {
            await addLabels(pr.number, core_1.getInput("labels-minor"));
            if (core_1.getInput("auto-label") || core_1.getInput("auto-label-minor"))
                await addLabels(pr.number, "minor");
            if (core_1.getInput("merge") || core_1.getInput("merge-minor"))
                await tryAutoMerge(pr.number, pr.title);
            if (core_1.getInput("approve") || core_1.getInput("approve-minor"))
                await autoApprove(pr.number);
        }
        else if (diffType === "preminor") {
            await addLabels(pr.number, core_1.getInput("labels-preminor"));
            if (core_1.getInput("auto-label") || core_1.getInput("auto-label-preminor"))
                await addLabels(pr.number, "preminor");
            if (core_1.getInput("merge") || core_1.getInput("merge-preminor"))
                await tryAutoMerge(pr.number, pr.title);
            if (core_1.getInput("approve") || core_1.getInput("approve-preminor"))
                await autoApprove(pr.number);
        }
        else if (diffType === "patch") {
            await addLabels(pr.number, core_1.getInput("labels-patch"));
            if (core_1.getInput("auto-label") || core_1.getInput("auto-label-patch"))
                await addLabels(pr.number, "patch");
            if (core_1.getInput("merge") || core_1.getInput("merge-patch"))
                await tryAutoMerge(pr.number, pr.title);
            if (core_1.getInput("approve") || core_1.getInput("approve-patch"))
                await autoApprove(pr.number);
        }
        else if (diffType === "prepatch") {
            await addLabels(pr.number, core_1.getInput("labels-prepatch"));
            if (core_1.getInput("auto-label") || core_1.getInput("auto-label-prepatch"))
                await addLabels(pr.number, "prepatch");
            if (core_1.getInput("merge") || core_1.getInput("merge-prepatch"))
                await tryAutoMerge(pr.number, pr.title);
            if (core_1.getInput("approve") || core_1.getInput("approve-prepatch"))
                await autoApprove(pr.number);
        }
        else if (diffType === "prerelease") {
            await addLabels(pr.number, core_1.getInput("labels-prerelease"));
            if (core_1.getInput("auto-label") || core_1.getInput("auto-label-prerelease"))
                await addLabels(pr.number, "prerelease");
            if (core_1.getInput("merge") || core_1.getInput("merge-prerelease"))
                await tryAutoMerge(pr.number, pr.title);
            if (core_1.getInput("approve") || core_1.getInput("approve-prerelease"))
                await autoApprove(pr.number);
        }
    }
};
exports.run = run;
//# sourceMappingURL=run.js.map
