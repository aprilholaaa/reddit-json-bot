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

async function resolveRedditUrl(url) {

  // redd.it short links
  if (url.includes("redd.it")) {

    const postId = url.split("/").pop();

    return `https://www.reddit.com/comments/${postId}/`;
  }

  // /s/ share links
  if (url.includes("/s/")) {

    const response = await fetch(url, {
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    return response.url;
  }

  return url;
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

      let finalUrl = await resolveRedditUrl(link);

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

client.login(process.env.TOKEN);
