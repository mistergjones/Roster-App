const { runSql } = require("./queries");
const {
  convertStringDateToMilliseconds,
  convertMillisecondsToLocalTime,
  convertMillisecondsToDate,
  calculateBreak,
  calculateShiftDurationExcludingBreak,
} = require("../lib/roster");

const moment = require("moment");

const getRoster = async (week_Number = 1) => {
  // let startDate = convertStringDateToMilliseconds(rosterStartDate).toString();
  // let endDate = convertStringDateToMilliseconds(rosterEndDate).toString();
  let weekNumber = Number(week_Number);
  const sql =
    "select title,start_date,end_date,week_number,timeslot_from,timeslot_to,username from roster, shifts, staff where shifts.roster_id = roster.roster_id and shifts.staff_id=staff.staff_id and roster.week_number=$1;";
  const params = [weekNumber];
  let weekStart;
  let weekEnd;
  let rosterDaysArr = [];
  try {
    const { rows } = await runSql(sql, params);
    console.log("rows", rows);
    weekStart = new Date(rows[0].start_date);
    weekEnd = new Date(rows[0].end_date);
    let rosterPeriod = (weekEnd - weekStart) / 1000 / 60 / 60 / 24;
    rosterDaysArr = [];
    for (let i = 0; i <= rosterPeriod; i++) {
      let nextDay = new Date(weekStart);
      nextDay.setDate(nextDay.getDate() + i);
      rosterDaysArr.push(nextDay.toDateString());
    }
    console.log("rosterDaysArr", rosterDaysArr);
    let data = {};
    rows.forEach((row, index) => {
      let shiftDate = convertMillisecondsToDate(row.timeslot_from);
      console.log({ shiftDate });
      if (rosterDaysArr.includes(shiftDate)) {
        let shift = {};
        shift["start_time"] = convertMillisecondsToLocalTime(row.timeslot_from);
        shift["end_time"] = convertMillisecondsToLocalTime(row.timeslot_to);
        shift["break_length"] = calculateBreak(
          row.timeslot_from,
          row.timeslot_to
        );
        shift["shift_duration"] = calculateShiftDurationExcludingBreak(
          row.timeslot_from,
          row.timeslot_to
        );
        shift["week_start"] = row.start_date;
        shift["week_end"] = row.end_date;
        shift["username"] = row.username;
        shift["work_date"] = convertMillisecondsToDate(row.timeslot_from);

        weekStart = shift["week_start"];
        weekEnd = shift["week_end"];

        if (Object.keys(data).includes(row.username)) {
          data[row.username].push(shift);
        } else {
          data[row.username] = [shift];
        }
      }
    });

    // weekStart = new Date(weekStart);
    // weekEnd = new Date(weekEnd);
    // let rosterPeriod = (weekEnd - weekStart) / 1000 / 60 / 60 / 24;
    // let rosterDaysArr = [];
    // for (let i = 0; i <= rosterPeriod; i++) {
    //   let nextDay = new Date(weekStart);
    //   nextDay.setDate(nextDay.getDate() + i);
    //   rosterDaysArr.push(nextDay.toDateString());
    // }

    Object.keys(data).forEach((staff, index1) => {
      let match = false;
      rosterDaysArr.forEach((day, index3) => {
        data[staff].forEach((shift, index2) => {
          if (shift.work_date === day) {
            match = true;
          }
        });
        if (match === false) {
          let blankShift = {
            start_time: "",
            end_time: "",
            break_length: 0,
            shift_duration: 0,
            week_start: "",
            week_end: "",
            username: "",
            work_date: "",
          };
          blankShift.week_start = weekStart;
          blankShift.week_end = weekEnd;
          blankShift.work_date = day;
          blankShift.username = staff;
          data[staff].unshift(blankShift);
        }
      });
    });

    //sorting shifts according to dates in ascending order
    console.log(Object.keys(data));
    Object.keys(data).forEach((staff) => {
      data[staff].sort((a, b) =>
        Date(a.work_date) < Date(b.work_date) ? -1 : 1
      );
    });

    // Object.keys(data).forEach((staff) => {
    //   data[staff].filter((shift, index) => {
    //     if (!rosterDaysArr.includes(shift.work_date)) {
    //       data[staff].splice(index, 1);
    //     }
    //   });
    // });

    console.log(data);

    return data;
  } catch (e) {
    console.log("Error while quering database: ", e);
  }
};

const getAllRosterWeeks = async () => {
  try {
    const sql = "select * from roster ORDER BY week_number DESC;";
    const { rows } = await runSql(sql, []);
    let allRosters = [];
    rows.forEach((row) => allRosters.push(row));

    return allRosters;
  } catch (error) {
    console.log(error);
  }
};

const createRoster = async (weekNumber) => {
  try {
    const sql =
      "INSERT INTO roster(title,start_date,end_date,week_number,status) VALUES ('From Api','2020-08-24','2020-08-30',$1,'Open');";
    const params = [weekNumber];
    const results = await runSql(sql, params);
  } catch (error) {
    console.log(error);
  }
  try {
    return await getRosterIdFromWeekNumber(weekNumber);
  } catch (error) {
    console.log(error);
  }
};

const getRosterIdFromWeekNumber = async (weekNumber) => {
  try {
    const sql = "SELECT roster_id from roster WHERE week_number = $1";
    const params = [weekNumber];
    const { rows } = await runSql(sql, params);
    console.log(rows[0].roster_id);
    return rows[0].roster_id;
  } catch (error) {
    console.log(error);
  }
};

const addShifts = async (rosterId, shifts) => {
  // INSERT INTO shifts(timeslot_from,timeslot_to,isAllocated,staff_id) VALUES (1599444000000,1599454800000,FALSE,6);

  for (let i = 0; i < shifts.length; i++) {
    const shift = shifts[i];
    try {
      const sql =
        "INSERT INTO shifts(timeslot_from,timeslot_to,isAllocated,staff_id,roster_id, group_id, title)VALUES ($1,$2,FALSE,$3,$4,$5,$6)";
      const params = [
        moment(shift.start_time).unix(),
        moment(shift.end_time).unix(),
        shift.staffId,
        rosterId,
        shift.group,
        shift.title,
      ];
      console.log(params[0], moment(params[1]));
      await runSql(sql, params);
    } catch (error) {
      console.log(error);
    }
  }
};

const updateShifts = async (weekNumber, shifts) => {
  const oldShifts = await getShiftsForWeekNumber(weekNumber);
  console.log(oldShifts);
  for (let i = 0; i < shifts.length; i++) {
    let match = false;
    for (let x = 0; x < oldShifts.length; x++) {
      if (shifts[i].shift_id === oldShifts[x].shift_id) {
        match = true;

        const sql =
          "UPDATE shifts SET timeslot_from = $1, timeslot_to =$2, staff_id =$3, group_id = $4, title = $5 WHERE shift_id = $6;";
        const params = [
          moment(shifts[i].start_time).unix(),
          moment(shifts[i].end_time).unix(),
          shifts[i].staffId,
          shifts[i].group,
          shifts[i].title,
          shifts[i].shift_id,
        ];
        await runSql(sql, params);
      }
    }

    if (!match) {
      await addShifts(weekNumber, shifts[i]);
    }
  }
};

const getCurrentWeekNumber = async () => {
  const sql =
    "SELECT week_number  FROM roster ORDER BY week_number DESC LIMIT 1;";

  const params = [];
  try {
    const { rows } = await runSql(sql, params);
    return rows[0].week_number + 1;
  } catch (error) {
    console.log(error);
  }
};

const getRosterWeeks = async () => {
  const sql = "SELECT week_number from roster;";
  params = [];
  try {
    const weeks = await runSql(sql, params);
    return weeks;
  } catch (error) {
    console.log(error);
  }
};

const getShiftsForWeekNumber = async (weekNumber) => {
  try {
    const rosterId = await getRosterIdFromWeekNumber(weekNumber);
    const sql = "Select * from shifts where roster_id = $1;";
    const params = [rosterId];
    const { rows } = await runSql(sql, params);
    let results = [];
    rows.forEach((row) => {
      row.start_time = row.timeslot_from;
      row.end_time = row.timeslot_to;
      row.group = row.group_id;
      results.push(row);
      console.log("time slot from = ", row.timeslot_from);
    });
    return results;
  } catch (error) {
    console.log(error);
  }
};
module.exports = {
  getRoster,
  getAllRosterWeeks,
  createRoster,
  addShifts,
  getCurrentWeekNumber,
  getRosterWeeks,
  getShiftsForWeekNumber,
  updateShifts,
};
