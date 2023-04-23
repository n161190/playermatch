const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "covid19India.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertPlayerDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchDbObjectToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    districtName: dbObject.district_name,
    match: dbObject.match,
    year: dbObject.year,
  };
};

app.get("/players/", async (request, response) => {
  const getPlayerQuery = `
    SELECT
      *
    FROM
      player_details;`;
  const playerArray = await database.all(getPlayerQuery);
  response.send(
    playerArray.map((eachPlayer) =>
      convertPlayerDbObjectToResponseObject(eachPlayer)
    )
  );
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT 
      *
    FROM 
      player_details 
    WHERE 
      player_id = ${playerId};`;
  const player = await database.get(getPlayerQuery);
  response.send(convertPlayerDbObjectToResponseObject(player));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
  UPDATE
    player_details
  SET
    player_name = '${playerName}',
  WHERE
    player_id = ${playerId};
  `;

  await database.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT
      *
    FROM
     match_details
    WHERE
      match_id = ${matchId};`;
  const match = await database.get(getMatchQuery);
  response.send(convertMatchDbObjectToResponseObject(match));
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerNameQuery = `
    SELECT
      *
    FROM
      player_match_score NATURAL JOIN match_details
    WHERE 
      player_id=${playerId};`;
  const player = await database.get(getPlayerNameQuery);
  response.send(
    player.map((each) => convertMatchDbObjectToResponseObject(each))
  );
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchNameQuery = `
    SELECT
      *
    FROM
      player_match_score NATURAL JOIN player_details
    WHERE 
      match_id=${matchId};`;
  const match = await database.get(getMatchNameQuery);
  response.send(
    match.map((each) => convertPlayerDbObjectToResponseObject(each))
  );
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getMatch = `
    SELECT
    player_id AS playerId,
    player_name AS playerName,
    SUM(score) AS totalScore,
    SUM(fours) AS totalFours
    SUM(sixes) AS totalSixes
    FROM player_match_score
    NATURAL JOIN player_details
    WHERE player_id=${playerId};
    `;
  const player = await database.get(getMatch);
  response.send(player);
});

module.exports = app;
