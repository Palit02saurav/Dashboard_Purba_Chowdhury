const router = require("express").Router();
const c = require("../controllers/leave.controller");

router.get("/", c.getLeaves);
router.post("/", c.createLeave);
router.delete("/:id", c.deleteLeave);

module.exports = router;