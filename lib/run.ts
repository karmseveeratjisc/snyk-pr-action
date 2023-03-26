import { getInput, info as logInfo } from "@actions/core";
import { getOctokit } from "@actions/github";
import { diff } from "semver";
import { addLabelsToPR, tryAutoMergePR, autoApprovePR } from "./utils";

const SNYK_UPGRADE_PR_TITLE_REGEXP = /\[Snyk\].+?[Uu]pgrade (.+?) from (.+?) to (.+?)$/;

export const run = async () => {
  const token = getInput("token") || process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GitHub token not found");
  const [owner, repo] = (process.env.GITHUB_REPOSITORY || "").split("/");
  const octokit = getOctokit(token);
  const ignoreStatusChecks = getInput("ignore-status-checks");
  const addLabels = addLabelsToPR.bind(null, octokit, owner, repo);
  const tryAutoMerge = tryAutoMergePR.bind(null, octokit, owner, repo);
  const autoApprove = autoApprovePR.bind(null, octokit, owner, repo);

  const prs = await octokit.pulls.list({ owner, repo, state: "open" });

  // Is this really a Snyk upgrade PR?
  // - has [Snyk] in the title
  // - head commit by Snyk bot
  const openSynkPrs = prs.data.filter(
    (pr) => pr.title.startsWith("[Snyk]") && pr.head.label.includes("CondeNast:snyk-upgrade")
  );

  logInfo(`Found ${openSynkPrs.length} open Snyk PRs`);

  for await (const pr of openSynkPrs) {
    logInfo(`Working on Synk PR...#${pr.number}:${pr.title}`);
    const lastCommitHash = pr._links.statuses.href.split("/").pop() || "";

    // Abort if PR has not passed checks or have success status
    if (!ignoreStatusChecks) {
      const checkRuns = await octokit.checks.listForRef({ owner, repo, ref: lastCommitHash });
      const allChecksHaveSucceeded = checkRuns.data.check_runs.every(
        (run) => run.conclusion === "success" || run.conclusion === "skipped"
      );
      if (!allChecksHaveSucceeded) {
        continue;
      }
      const statuses = await octokit.repos.listCommitStatusesForRef({
        owner,
        repo,
        ref: lastCommitHash,
      });
      const uniqueStatuses = statuses.data.filter(
        (item, index, self) => self.map((i) => i.context).indexOf(item.context) === index
      );
      const allStatusesHaveSucceeded = uniqueStatuses.every((run) => run.state === "success");
      if (!allStatusesHaveSucceeded) {
        continue;
      }
    }

    let diffType: string | null = "";
    const matches = pr.title.match(SNYK_UPGRADE_PR_TITLE_REGEXP);
    if (matches) {
      let pkgName = matches[1];
      let from = matches[2];
      let to = matches[3];
      diffType = diff(from, to);
    }

    if (diffType === "major") {
      await addLabels(pr.number, getInput("labels-major"));
      if (getInput("auto-label") || getInput("auto-label-major"))
        await addLabels(pr.number, "major");
      if (getInput("merge") || getInput("merge-major")) await tryAutoMerge(pr.number, pr.title);
      if (getInput("approve") || getInput("approve-major")) await autoApprove(pr.number);
    } else if (diffType === "premajor") {
      await addLabels(pr.number, getInput("labels-premajor"));
      if (getInput("auto-label") || getInput("auto-label-premajor"))
        await addLabels(pr.number, "premajor");
      if (getInput("merge") || getInput("merge-premajor")) await tryAutoMerge(pr.number, pr.title);
      if (getInput("approve") || getInput("approve-premajor")) await autoApprove(pr.number);
    } else if (diffType === "minor") {
      await addLabels(pr.number, getInput("labels-minor"));
      if (getInput("auto-label") || getInput("auto-label-minor"))
        await addLabels(pr.number, "minor");
      if (getInput("merge") || getInput("merge-minor")) await tryAutoMerge(pr.number, pr.title);
      if (getInput("approve") || getInput("approve-minor")) await autoApprove(pr.number);
    } else if (diffType === "preminor") {
      await addLabels(pr.number, getInput("labels-preminor"));
      if (getInput("auto-label") || getInput("auto-label-preminor"))
        await addLabels(pr.number, "preminor");
      if (getInput("merge") || getInput("merge-preminor")) await tryAutoMerge(pr.number, pr.title);
      if (getInput("approve") || getInput("approve-preminor")) await autoApprove(pr.number);
    } else if (diffType === "patch") {
      await addLabels(pr.number, getInput("labels-patch"));
      if (getInput("auto-label") || getInput("auto-label-patch"))
        await addLabels(pr.number, "patch");
      if (getInput("merge") || getInput("merge-patch")) await tryAutoMerge(pr.number, pr.title);
      if (getInput("approve") || getInput("approve-patch")) await autoApprove(pr.number);
    } else if (diffType === "prepatch") {
      await addLabels(pr.number, getInput("labels-prepatch"));
      if (getInput("auto-label") || getInput("auto-label-prepatch"))
        await addLabels(pr.number, "prepatch");
      if (getInput("merge") || getInput("merge-prepatch")) await tryAutoMerge(pr.number, pr.title);
      if (getInput("approve") || getInput("approve-prepatch")) await autoApprove(pr.number);
    } else if (diffType === "prerelease") {
      await addLabels(pr.number, getInput("labels-prerelease"));
      if (getInput("auto-label") || getInput("auto-label-prerelease"))
        await addLabels(pr.number, "prerelease");
      if (getInput("merge") || getInput("merge-prerelease"))
        await tryAutoMerge(pr.number, pr.title);
      if (getInput("approve") || getInput("approve-prerelease")) await autoApprove(pr.number);
    }
  }

  logInfo("All done!");
};
