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

      // STEP 1 — expand short/share URL
      if (
        link.includes("/s/") ||
        link.includes("redd.it")
      ) {

        finalUrl = await resolveFinalRedditUrl(link);
      }

      // STEP 2 — clean URL
      finalUrl = finalUrl.split("?")[0];

      if (finalUrl.endsWith("/")) {
        finalUrl = finalUrl.slice(0, -1);
      }

      // STEP 3 — only now append .json
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
