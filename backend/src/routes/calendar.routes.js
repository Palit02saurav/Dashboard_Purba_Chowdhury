const router = require("express").Router();
const c = require("../controllers/calendar.controller");

router.get("/", c.getMonth);

module.exports = router;