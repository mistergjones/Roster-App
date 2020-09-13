const { runSql } = require("./queries");
const bcrypt = require("bcrypt");

const doLogin = async (email, password) => {
  console.log("password = " + password);
  //changed here
  const sql =
    "select users.email,users.password, users.user_id, groups.title from users,staff,stafftogroups,groups where users.email=staff.email and staff.staff_id=stafftogroups.staff_member_id and stafftogroups.staff_role_id=groups.id and users.email=$1;";
  const params = [email];

  try {
    const { rows } = await runSql(sql, params);
    console.log("rows = " + rows);
    if (bcrypt.compareSync(password, rows[0].password)) {
      // console.log("doLogin rows", rows);
      let arr = [];
      rows.forEach((role) => arr.push(role.title));
      let tempResult = {};
      tempResult.email = rows[0].email;
      tempResult.password = rows[0].password;
      tempResult.role = arr;
      let result = [];
      result.push(tempResult);
      return result;
    } else {
      console.log("Password and email did not match");
      return false;
    }
  } catch (error) {
    console.log(error);
  }
};

const createUser = async (email, hashedPassword) => {
  const sql = `INSERT INTO users (email, password) VALUES ($1,$2);`;
  const params = [email, hashedPassword];
  await runSql(sql, params);

  return (newUser = {
    email: email,
  });
};

module.exports = {
  doLogin,
  createUser,
};
