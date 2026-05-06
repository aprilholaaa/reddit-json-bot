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

client.on("messageCreate", async (message) => {

  if (message.author.bot) return;

  const text = message.content;

  const regex = /(https?:\/\/[^\s]+)/gi;

  const matches = text.match(regex);

  if (!matches) return;

  for (const link of matches) {

    if (
      !link.includes("reddit.com") &&
      !link.includes("redd.it")
    ) continue;

    try {

      let finalUrl = link;

      // Handle short Reddit links
      if (
        link.includes("redd.it") ||
        link.includes("/s/")
      ) {

        const response = await fetch(link, {
          method: "HEAD",
          redirect: "manual",
          headers: {
            "User-Agent": "Mozilla/5.0"
          }
        });

        const redirectedUrl = response.headers.get("location");

        if (redirectedUrl) {

          finalUrl = redirectedUrl.startsWith("http")
            ? redirectedUrl
            : `https://www.reddit.com${redirectedUrl}`;
        }
      }

      finalUrl = finalUrl.split("?")[0];

      if (finalUrl.endsWith("/")) {
        finalUrl = finalUrl.slice(0, -1);
      }

      const jsonUrl = finalUrl + ".json";

      await message.reply(`✅ JSON URL:\n${jsonUrl}`);

    } catch (err) {
      console.error(err);
      await message.reply("❌ Failed to process link");
    }
  }
});

client.login(process.env.TOKEN);
