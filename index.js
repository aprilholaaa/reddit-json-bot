require("dotenv").config();

const express = require("express");
const { Client, GatewayIntentBits } = require("discord.js");

const app = express();

app.use(express.json());

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

app.get("/", (req, res) => {
  res.send("Reddit JSON API Running");
});

// CONVERT API
app.post("/convert", async (req, res) => {

  try {

    let link = req.body.link;

    if (!link) {
      return res.status(400).json({
        error: "No link provided"
      });
    }

    // resolve short links
    if (
      link.includes("redd.it") ||
      link.includes("/s/")
    ) {

      const response = await fetch(link, {
        redirect: "follow",
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      });

      link = response.url;
    }

    // clean URL
    link = link.split("?")[0];

    if (link.endsWith("/")) {
      link = link.slice(0, -1);
    }

    // add .json
    const jsonUrl = link + ".json";

    return res.json({
      jsonUrl
    });

  } catch(err) {

    console.error(err);

    return res.status(500).json({
      error: "Conversion failed"
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

client.login(process.env.TOKEN);
