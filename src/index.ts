import { error as logError, setFailed } from "@actions/core";
import { run } from "../lib/run";

run()
  .then(() => {})
  .catch((error) => {
    logError(error);
    setFailed(error.message);
  });
