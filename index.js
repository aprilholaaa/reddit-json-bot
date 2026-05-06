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

async function resolveFinalRedditUrl(shortUrl) {

  const response = await fetch(shortUrl, {
    method: "GET",
    redirect: "follow",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    }
  });

  return response.url;
}

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

      // expand short/share links
      if (
        link.includes("/s/") ||
        link.includes("redd.it")
      ) {

        finalUrl = await resolveFinalRedditUrl(link);
      }

      finalUrl = finalUrl.split("?")[0];

      if (finalUrl.endsWith("/")) {
        finalUrl = finalUrl.slice(0, -1);
      }

      const jsonUrl = finalUrl + ".json";

      await message.reply(
        `✅ JSON URL:\n${jsonUrl}`
      );

    } catch (err) {

      console.error(err);

      await message.reply(
        "❌ Failed to process link"
      );
    }
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("API Server Running");
});

client.login(process.env.TOKEN);
