"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@actions/core");
const run_1 = require("../lib/run");
run_1.run()
    .then(() => {
    core_1.info("All done!");
})
    .catch((error) => {
    core_1.error(error);
    core_1.setFailed(error.message);
});
//# sourceMappingURL=index.js.map