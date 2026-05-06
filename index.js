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

  const redditRegex = /(https?:\/\/(www\.)?(reddit\.com|redd\.it)\/\S+)/gi;

  const matches = message.content.match(redditRegex);

  if (!matches) return;

  for (const url of matches) {
    try {
      const cleanUrl = url.replace(/\/$/, "");
      const jsonUrl = cleanUrl + ".json";

      await message.reply(`✅ JSON URL:\n${jsonUrl}`);
    } catch (err) {
      console.error(err);
      await message.reply("❌ Failed to process link");
    }
  }
});

client.login(process.env.TOKEN);
