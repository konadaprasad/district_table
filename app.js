const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
const app = express();
app.use(express.json());
const connecting_server_and_db = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Sever Running");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};
connecting_server_and_db();

const response_to_map = (object) => {
  return {
    playerId: object.player_id,
    playerName: object.player_name,
  };
};
app.get("/players/", async (request, response) => {
  const getQuery = `SELECT *  FROM  player_details;`;
  const result = await db.all(getQuery);
  response.send(
    result.map((item) => {
      return {
        playerId: item.player_id,
        playerName: item.player_name,
      };
    })
  );
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getBookQuery = `SELECT * FROM player_details WHERE player_id=${playerId};`;
  const result = await db.get(getBookQuery);
  response.send(response_to_map(result));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updateQuery = `UPDATE player_details SET 
  player_name='${playerName}'
  WHERE player_id=${playerId};`;
  await db.run(updateQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getBookQuery = `SELECT * FROM match_details WHERE match_id=${matchId};`;
  const result = await db.get(getBookQuery);
  response.send({
    matchId: result.match_id,
    match: result.match,
    year: result.year,
  });
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getBookQuery = `SELECT match_details.match_id,
  match_details.match,
  match_details.year FROM match_details NATURAL JOIN player_match_score  WHERE player_match_score.player_id=${playerId};`;
  const result = await db.all(getBookQuery);
  response.send(result);
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getBookQuery = `SELECT player_details.player_id,
  player_details.player_name
  FROM player_details NATURAL JOIN player_match_score  WHERE player_match_score.match_id=${matchId};`;
  const result = await db.all(getBookQuery);
  response.send(result);
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getBookQuery = `SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};
    `;
  const result = await db.get(getBookQuery);
  response.send(result);
});
module.exports = app;
