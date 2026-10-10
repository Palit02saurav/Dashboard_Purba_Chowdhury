const router = require("express").Router();
const c = require("../controllers/worker.controller");
const upload = require("../middleware/upload");

router.get("/template", c.downloadTemplate);
router.post("/import", upload.single("file"), c.importWorkers);
router.get("/", c.getWorkers);
router.post("/", c.createWorker);
router.put("/:id", c.updateWorker);
router.delete("/:id", c.deleteWorker);

module.exports = router;