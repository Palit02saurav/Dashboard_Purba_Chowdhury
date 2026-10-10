const router = require("express").Router();
const c = require("../controllers/meeting.controller");

router.get("/", c.getMeetings);
router.post("/", c.createMeeting);
router.delete("/:id", c.deleteMeeting);

module.exports = router;