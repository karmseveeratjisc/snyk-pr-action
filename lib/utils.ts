import { error as logError, getInput, info as logInfo } from "@actions/core";
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const addLabelsToPR = async (
  octokit: any,
  owner: string,
  repo: string,
  prNumber: number,
  labels?: string
) => {
  logInfo(`To add labels: ${labels} on PR #${prNumber}`);
  if (labels) {
    const addLabels = labels.split(",").map((i) => i.trim());
    await octokit.issues.addLabels({
      owner,
      repo,
      issue_number: prNumber,
      labels: addLabels,
    });
  }
};

export const tryAutoMergePR = async (
  octokit: any,
  owner: string,
  repo: string,
  prNumber: number,
  prTitle: string,
  delaySeconds = 1
) => {
  if (delaySeconds > 10) return;
  logInfo(`Try to merge PR #${prNumber} after ${delaySeconds} seconds`);
  try {
    await octokit.pulls.merge({
      owner,
      repo,
      pull_number: prNumber,
      commit_title: (
        getInput("merge-commit") || `:twisted_rightwards_arrows: Merge #$PR_NUMBER ($PR_TITLE)`
      )
        .replace("$PR_NUMBER", prNumber.toString())
        .replace("$PR_TITLE", prTitle),
    });
  } catch (error) {
    logError(error);
    await wait(delaySeconds * 1000);
    await tryAutoMergePR(octokit, owner, repo, prNumber, prTitle, delaySeconds + 1);
  }
};

export const autoApprovePR = async (octokit: any, owner: string, repo: string, prNumber: number) => {
  logInfo(`To auto approve PR #${prNumber}`);
  try {
    await octokit.pulls.createReview({ owner, repo, pull_number: prNumber, event: "APPROVE" });
  } catch (error) {}
};
