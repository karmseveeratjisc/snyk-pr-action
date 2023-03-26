export declare const addLabelsToPR: (octokit: any, owner: string, repo: string, prNumber: number, labels?: string | undefined) => Promise<void>;
export declare const tryAutoMergePR: (octokit: any, owner: string, repo: string, prNumber: number, prTitle: string, delaySeconds?: number) => Promise<void>;
export declare const autoApprovePR: (octokit: any, owner: string, repo: string, prNumber: number) => Promise<void>;
