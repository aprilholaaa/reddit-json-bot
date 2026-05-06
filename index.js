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

// Home Route
app.get("/", (req, res) => {
  res.send("Reddit JSON API Running");
});

// Convert Route
app.post("/convert", async (req, res) => {

  try {

    let link = req.body.link;

    if (!link) {
      return res.status(400).json({
        error: "No link provided"
      });
    }

    // Resolve short Reddit links
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

    // Remove query params
    link = link.split("?")[0];

    // Remove ending slash
    if (link.endsWith("/")) {
      link = link.slice(0, -1);
    }

    // Add .json
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

// Discord Bot Message Listener
client.on("messageCreate", async (message) => {

  if (message.author.bot) return;

  const regex = /(https?:\/\/[^\s]+)/gi;

  const matches = message.content.match(regex);

  if (!matches) return;

  for (const link of matches) {

    if (
      !link.includes("reddit.com") &&
      !link.includes("redd.it")
    ) continue;

    try {

      let finalUrl = link;

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

        finalUrl = response.url;
      }

      finalUrl = finalUrl.split("?")[0];

      if (finalUrl.endsWith("/")) {
        finalUrl = finalUrl.slice(0, -1);
      }

      const jsonUrl = finalUrl + ".json";

      await message.reply(
        `✅ JSON URL:\n${jsonUrl}`
      );

    } catch(err) {

      console.error(err);

      await message.reply(
        "❌ Failed to process link"
      );
    }
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

client.login(process.env.TOKEN);
