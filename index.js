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

  const redditRegex = /(https?:\/\/(?:www\.)?(?:redd\.it|reddit\.com)\/\S+)/gi;

  const matches = text.match(redditRegex);

  if (!matches) return;

  for (const url of matches) {

    try {

      const response = await fetch(url, {
        redirect: "follow",
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      });

      let finalUrl = response.url;

      finalUrl = finalUrl.replace(/\/$/, "");

      const jsonUrl = finalUrl + ".json";

      await message.reply(`✅ JSON URL:\n${jsonUrl}`);

    } catch (err) {

      console.error(err);

      await message.reply(`❌ Failed to process link`);

    }

  }

});

client.login(process.env.TOKEN);
