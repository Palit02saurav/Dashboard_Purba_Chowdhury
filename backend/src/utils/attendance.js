// Mon–Sat are working days, Sunday is off
const isWorkingDay = (dateStr) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).getDay() !== 0;
};

// Status of one worker on one date:
// "leave" | "present" | "half-day" | "absent" | null
//  - before joining date          -> null
//  - on approved leave            -> "leave" (wage 0)
//  - saved record (absent/half..) -> that status
//  - working day up to `upTo`     -> "present" (default)
const dayStatus = ({ date, joiningDate, upTo, onLeave, saved }) => {
  if (!joiningDate || date < joiningDate) return null;
  if (onLeave) return "leave";
  if (saved) return saved;
  if (date <= upTo && isWorkingDay(date)) return "present";
  return null;
};

module.exports = { isWorkingDay, dayStatus };