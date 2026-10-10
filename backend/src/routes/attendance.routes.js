const router = require("express").Router();
const c = require("../controllers/attendance.controller");

router.get("/", c.getByDate);
router.post("/", c.mark);

module.exports = router;    