const express = require("express");
const router = express.Router();
const {
  getAllRoutineActivities,
  updateRoutineActivity,
  canEditRoutineActivity,
  destroyRoutineActivity,
  getRoutineActivityById,
  addActivityToRoutine,
} = require("../db");
const client = require("../db/client");
const { requireUser, requiredNotSent } = require("./utils");

// GET /api/routine_activities/
router.get("/", async (req, res, next) => {
  try {
    const routine_activities = await getAllRoutineActivities();
    res.send(routine_activities);
  } catch (error) {
    next(error);
  }
});

// POST /api/routine_activities
router.post(
  "/",
  requireUser,
  requiredNotSent({
    requiredParams: ["routineId", "activityId", "duration", "count"],
  }),
  async (req, res) => {
    try {
      console.log("Object:", req.params);

      const { routineId, activityId, count, duration } = req.body;

      const addedActivity = await addActivityToRoutine({
        creatorId: req.user.id,
        routineId: routineId,
        activityId: activityId,
        count: count,
        duration: duration,
      });
      if (addedActivity) {
        res.send(addedActivity);
      } else {
        next({
          name: "FailedToAddActivity",
          message: "There was an error adding the activity to the routine",
        });
      }
    } catch (error) {
      console.error(error.message);
    }
  }
);

// PATCH /api/routine_activities/:routineActivityId
router.patch(
  "/:routineActivityId",
  requireUser,
  requiredNotSent({ requiredParams: ["count", "duration"], atLeastOne: true }),
  async (req, res, next) => {
    try {
      const { count, duration } = req.body;
      const { routineActivityId } = req.params;
      const routineActivityToUpdate = await getRoutineActivityById(
        routineActivityId
      );
      console.log("User", req.user);
      if (!routineActivityToUpdate) {
        next({
          name: "NotFound",
          message: `No routine_activity found by ID ${routineActivityId}`,
        });
      } else {
        if (
          !(await canEditRoutineActivity(
            req.params.routineActivityId,
            req.user.id
          ))
        ) {
          res.status(403);
          next({
            name: "Unauthorized",
            message: "You cannot edit this routine_activity!",
          });
        } else {
          const updatedRoutineActivity = await updateRoutineActivity({
            id: req.params.routineActivityId,
            count,
            duration,
          });
          res.send(updatedRoutineActivity);
        }
      }
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/routine_activities/:routineActivityId
router.delete("/:routineActivityId", requireUser, async (req, res, next) => {
  try {
    if (
      !(await canEditRoutineActivity(req.params.routineActivityId, req.user.id))
    ) {
      res.status(403);
      next({
        name: "Unauthorized",
        message: "You cannot edit this routine_activity!",
      });
    } else {
      const deletedRoutineActivity = await destroyRoutineActivity(
        req.params.routineActivityId
      );
      res.send({ success: true, ...deletedRoutineActivity });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
