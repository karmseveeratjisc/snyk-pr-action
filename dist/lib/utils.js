"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoApprovePR = exports.tryAutoMergePR = exports.addLabelsToPR = void 0;
const core_1 = require("@actions/core");
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const addLabelsToPR = async (octokit, owner, repo, prNumber, labels) => {
    core_1.info(`To add labels: ${labels} on PR #${prNumber}`);
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
exports.addLabelsToPR = addLabelsToPR;
const tryAutoMergePR = async (octokit, owner, repo, prNumber, prTitle, delaySeconds = 1) => {
    core_1.info(`Try to merge PR #${prNumber} after ${delaySeconds} seconds`);
    try {
        await octokit.pulls.merge({
            owner,
            repo,
            pull_number: prNumber,
            merge_method: core_1.getInput("merge-method") || "squash",
            commit_title: (core_1.getInput("merge-commit") || `:twisted_rightwards_arrows: Merge #$PR_NUMBER ($PR_TITLE)`)
                .replace("$PR_NUMBER", prNumber.toString())
                .replace("$PR_TITLE", prTitle),
        });
    }
    catch (error) {
        core_1.error(error);
        await wait(delaySeconds * 1000);
        if (delaySeconds > 9) {
            const conflictLabel = core_1.getInput("labels-conflicted");
            if (/not mergeable/.test(error.message) && conflictLabel) {
                try {
                    await exports.addLabelsToPR(octokit, owner, repo, prNumber, conflictLabel);
                }
                catch (error) {
                    core_1.error(error);
                }
            }
            return;
        }
        await exports.tryAutoMergePR(octokit, owner, repo, prNumber, prTitle, delaySeconds + 1);
    }
};
exports.tryAutoMergePR = tryAutoMergePR;
const autoApprovePR = async (octokit, owner, repo, prNumber) => {
    core_1.info(`To auto approve PR #${prNumber}`);
    try {
        await octokit.pulls.createReview({ owner, repo, pull_number: prNumber, event: "APPROVE" });
    }
    catch (error) { }
};
exports.autoApprovePR = autoApprovePR;
//# sourceMappingURL=utils.js.map