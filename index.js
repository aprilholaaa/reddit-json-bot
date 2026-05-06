require("dotenv").config();

const { Client, GatewayIntentBits } = require("discord.js");

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

async function resolveUrl(url) {

  const response = await fetch(url, {
    method: "GET",
    redirect: "follow",
    headers: {
      "User-Agent": "Mozilla/5.0"
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

      // resolve short/share URLs
      if (
        link.includes("redd.it") ||
        link.includes("/s/")
      ) {

        finalUrl = await resolveUrl(link);
      }

      // remove query params
      finalUrl = finalUrl.split("?")[0];

      // remove trailing slash
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

client.login(process.env.TOKEN);
