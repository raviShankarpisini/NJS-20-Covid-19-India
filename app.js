const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const databasePath = path.join(__dirname, "covid19India.db");

const app = express();
app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  database = await open({
    filename: databasePath,
    driver: sqlite3.Database,
  });
  app.listen(3000, () =>
    console.log("server running at https://localhost:3000/")
  );
};
initializeDbAndServer();

const convertStateDbToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};
const convertDistrictDbToResponseObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

app.get("/states", async (request, response) => {
  const statesQuery = `
    SELECT 
        *
    FROM
        state;`;
  const allStates = await database.all(statesQuery);
  response.send(
    allStates.map((eachState) => convertStateDbToResponseObject(eachState))
  );
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const stateQuery = `
    SELECT 
        *
    FROM
        state
    WHERE
        state_id=${stateId};`;
  const singleSate = await database.get(stateQuery);
  response.send(convertStateDbToResponseObject(singleSate));
});

app.post("/districts", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const postDistrictQuery = `
    INSERT INTO district(district_name,state_id,cases,cured,active,deaths)
    VALUES
        ('${districtName}','${stateId}','${cases}','${cured}','${active}','${deaths}');`;
  await database.run(postDistrictQuery);
  response.send("District Successfully Added");
});

app.get("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const singleDistrictQuery = `
    SELECT 
        *
    FROM
        district
    WHERE 
    district_id=${districtId};`;
  const singleDistrict = await database.get(singleDistrictQuery);
  response.send(convertDistrictDbToResponseObject(singleDistrict));
});
app.delete("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const deleteQuery = `
    DELETE 
    FROM
        district
    WHERE
        district_id=${districtId};`;
  await database.run(deleteQuery);
  response.send("District Removed");
});
app.put("/districts/:districtId/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const { districtId } = request.params;
  const updateDistrictQuery = `
    UPDATE 
        district
    SET
        district_name='${districtName}',
        state_id=${stateId},
        cases=${cases},
        cured=${cured},
        active=${active},
        deaths=${deaths}
    WHERE
        district_id=${districtId};
    `;
  await database.run(updateDistrictQuery);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const statsQuery = `
    SELECT
        SUM(cases),
        SUM(cured),
        SUM(active),
        SUM(deaths)
    FROM
        district
    WHERE
        state_id=${stateId};`;
  const stats = await database.get(statsQuery);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const stateNameQuery = `
    SELECT 
        state_name 
    FROM
        state NATURAL JOIN district
    WHERE
        district_id=${districtId};`;
  const stateName = await database.get(stateNameQuery);
  response.send(convertStateDbToResponseObject(stateName));
});

module.exports = app;
