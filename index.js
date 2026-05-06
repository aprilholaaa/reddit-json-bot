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

  // detect reddit links
  const regex = /(https?:\/\/(www\.)?(reddit\.com|redd\.it)\/\S+)/gi;

  const matches = text.match(regex);

  if (!matches) return;

  for (const link of matches) {
    try {

      let clean = link.split("?")[0];

      if (clean.endsWith("/")) {
        clean = clean.slice(0, -1);
      }

      const jsonUrl = clean + ".json";

      await message.reply(`✅ JSON URL:\n${jsonUrl}`);

    } catch (err) {
      console.error(err);
      await message.reply("❌ Failed to process link");
    }
  }
});

client.login(process.env.TOKEN);
