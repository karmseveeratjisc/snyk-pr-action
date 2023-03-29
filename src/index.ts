import { error as logError, info as logInfo, setFailed } from "@actions/core";
import { run } from "../lib/run";

run()
  .then(() => {
    logInfo("All done!");
  })
  .catch((error) => {
    logError(error);
    setFailed(error.message);
  });
