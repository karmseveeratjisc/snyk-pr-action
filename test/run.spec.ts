import { mocked } from "ts-jest/utils";
import { run } from "../lib/run";
import { addLabelsToPR, autoApprovePR, tryAutoMergePR } from "../lib/utils";
import { back as nockBack } from "nock";
import { getInput, info as logInfo } from "@actions/core";

nockBack.fixtures = `${__dirname}/__fixtures`;
nockBack.setMode("lockdown");

jest.mock("@actions/core");
jest.mock("../lib/utils");
const mockGetInput = mocked(getInput);
const mockLogInfo = mocked(logInfo);
mockLogInfo.mockImplementation(console.log.bind(console));

const getInputDefaults = (name: string): string => {
  switch (name) {
    // to ignore PR checks status?
    case "ignore-status-checks":
      return "true";

    // apply custom labels to PR?
    case "labels-major":
    case "labels-premajor":
    case "labels-minor":
    case "labels-preminor":
    case "labels-patch":
    case "labels-prepatch":
      return "";

    // auto apply labels to PR depends on...?
    case "auto-label":
      return "true";

    // should auto merge for any upgrade?
    case "merge":
      return "";

    // should auto merge depends on...?
    case "merge-minor":
    case "merge-preminor":
    case "merge-patch":
    case "merge-prepatch":
      return "true";

    // other params?
    default:
      return "";
  }
};

describe("snyk-pr-action", () => {
  const OLD_ENV = process.env;

  beforeAll(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV }; // Make a copy
    process.env.GITHUB_REPOSITORY = "condenast/journey-purchase";
    process.env.GITHUB_TOKEN = "<MOCK_GITHUB_TOKEN>";
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  describe("scheduled run", () => {
    beforeAll(async () => {
      mockGetInput.mockImplementation((name) => {
        const inputVal = getInputDefaults(name);
        if (!inputVal) {
          switch (name) {
            // apply custom labels to PR?
            case "labels-major":
            case "labels-premajor":
            case "labels-minor":
            case "labels-preminor":
            case "labels-patch":
            case "labels-prepatch":
              return `custom-${name}`;

            // should auto approve?
            case "approve-major":
            case "approve-premajor":
              return "true";

            // should auto merge depends on...?
            case "merge-minor":
            case "merge-preminor":
            case "merge-patch":
            case "merge-prepatch":
              return "true";
          }
        }
        return inputVal;
      });

      // Use the following PR mocks as:
      // #1017: [Snyk] Security upgrade dd-trace from 0.30.6 to 1.2.0
      // #1016: [Snyk] Security upgrade fs-extra from 10.0.0 to 11.0.0
      // #1015: [Snyk] Security upgrade node-fetch from 2.6.7 to 2.6.9
      const { nockDone } = await nockBack("pulls.json");
      await run();
      nockDone();
    });

    afterAll(() => {
      mockGetInput.mockReset();
    });

    test("it should label PR based on release types", () => {
      // assert auto labeling PRs
      expect(addLabelsToPR).toHaveBeenCalledTimes(6);
      expect(addLabelsToPR).toHaveBeenNthCalledWith(
        1,
        expect.any(Object),
        "condenast",
        "journey-purchase",
        1017,
        "custom-labels-minor"
      );
      expect(addLabelsToPR).toHaveBeenNthCalledWith(
        2,
        expect.any(Object),
        "condenast",
        "journey-purchase",
        1017,
        "minor"
      );
      expect(addLabelsToPR).toHaveBeenNthCalledWith(
        3,
        expect.any(Object),
        "condenast",
        "journey-purchase",
        1015,
        "custom-labels-patch"
      );
      expect(addLabelsToPR).toHaveBeenNthCalledWith(
        4,
        expect.any(Object),
        "condenast",
        "journey-purchase",
        1015,
        "patch"
      );
      expect(addLabelsToPR).toHaveBeenNthCalledWith(
        5,
        expect.any(Object),
        "condenast",
        "journey-purchase",
        1016,
        "custom-labels-major"
      );
      expect(addLabelsToPR).toHaveBeenNthCalledWith(
        6,
        expect.any(Object),
        "condenast",
        "journey-purchase",
        1016,
        "major"
      );
    });

    test("it should auto-merge PR if it is minor/patch release", () => {
      // assert auto approving PRs
      expect(autoApprovePR).toHaveBeenCalledTimes(1);
      expect(autoApprovePR).toHaveBeenNthCalledWith(
        1,
        expect.any(Object),
        "condenast",
        "journey-purchase",
        1016
      );

      // assert auto labeling PRs
      expect(addLabelsToPR).toHaveBeenCalledTimes(6);
      expect(addLabelsToPR).toHaveBeenNthCalledWith(
        1,
        expect.any(Object),
        "condenast",
        "journey-purchase",
        1017,
        "custom-labels-minor"
      );
      expect(addLabelsToPR).toHaveBeenNthCalledWith(
        2,
        expect.any(Object),
        "condenast",
        "journey-purchase",
        1017,
        "minor"
      );
      expect(addLabelsToPR).toHaveBeenNthCalledWith(
        3,
        expect.any(Object),
        "condenast",
        "journey-purchase",
        1015,
        "custom-labels-patch"
      );
      expect(addLabelsToPR).toHaveBeenNthCalledWith(
        4,
        expect.any(Object),
        "condenast",
        "journey-purchase",
        1015,
        "patch"
      );
      expect(addLabelsToPR).toHaveBeenNthCalledWith(
        5,
        expect.any(Object),
        "condenast",
        "journey-purchase",
        1016,
        "custom-labels-major"
      );
      expect(addLabelsToPR).toHaveBeenNthCalledWith(
        6,
        expect.any(Object),
        "condenast",
        "journey-purchase",
        1016,
        "major"
      );

      // assert auto merging PRs
      expect(tryAutoMergePR).toHaveBeenCalledTimes(2);
      expect(tryAutoMergePR).toHaveBeenNthCalledWith(
        1,
        expect.any(Object),
        "condenast",
        "journey-purchase",
        1017,
        "[Snyk] Security upgrade fontfaceobserver from 2.1.0 to 2.3.0"
      );
      expect(tryAutoMergePR).toHaveBeenNthCalledWith(
        2,
        expect.any(Object),
        "condenast",
        "journey-purchase",
        1015,
        "[Snyk] Security upgrade node-fetch from 2.6.7 to 2.6.9"
      );
    });

    test("it should auto-approve PR if it is major release", () => {
      // assert auto approving PRs
      expect(autoApprovePR).toHaveBeenCalledTimes(1);
      expect(autoApprovePR).toHaveBeenNthCalledWith(
        1,
        expect.any(Object),
        "condenast",
        "journey-purchase",
        1016
      );
    });
  });
});
