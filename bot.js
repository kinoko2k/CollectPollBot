const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    Embed,
    MessageAttachment,
    Intents } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildPresences,
    ],
});


client.once('ready', () => {
    console.log(`ログインしました。${client.user.tag}!`);
});

const PREFIX = '!';

// 投票の情報を格納するマップ
const polls = new Map();

// 投票オプションを表す絵文字に対応するインデックスを取得する関数
function getOptionIndex(emoji) {
    const numberEmoji = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
    return numberEmoji.indexOf(emoji);
}

client.on('messageCreate', async (message) => {
    if (message.author.id === client.user.id) return;
    if (message.author.bot) return;
    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'poll') {
        if (!args[0] || args.length < 3 || args.length > 12) {
            message.reply('正しい形式でコマンドを実行してください。例: `!poll <題名> <選択肢1> ... <選択肢10>`');
            return;
        }

        const pollId = generateRandomId(); // ランダムなIDを生成
        const pollTitle = args[0];
        const pollOptions = args.slice(1, 11); // 最大10個の選択肢を設置

        const embed = new EmbedBuilder()
            .setTitle(pollTitle)
            .setDescription('投票結果を表示する：`' + `mc!pollend ${pollId}` + '`')
            .setColor('#00ff00');

        for (let i = 0; i < pollOptions.length; i++) {
            embed.addFields(
                { name: `${i + 1}. ` + pollOptions[i], value: " ", inline: false });
        }

        message.channel.send({ embeds: [embed] }).then((msg) => {
            for (let i = 0; i < pollOptions.length; i++) {
                msg.react(getEmoji(i + 1));
            }
            // 生成した投票の情報をマップに格納
            polls.set(pollId, { messageId: msg.id, channelId: message.channel.id, options: pollOptions });
        });
    } else if (command === 'pollend') {
        const pollId = args[0];
        const pollInfo = polls.get(pollId);

        if (!pollInfo) {
            message.reply('指定したIDの投票が見つかりません。');
            return;
        }

        const resultsEmbed = new EmbedBuilder()
            .setTitle(`投票結果 - ${pollId}`)
            .setColor('#00ff00');

        if (!pollInfo.options) {
            message.reply('投票結果がありません。');
            return;
        }

        // リアクションを取得して投票数を集計
        const messageObject = message.channel.messages.cache.get(pollInfo.messageId);
        if (messageObject) {
            await messageObject.reactions.cache.each(async (reaction) => {
                const emoji = reaction.emoji.name;
                const optionIndex = getOptionIndex(emoji);
                if (optionIndex >= 0 && optionIndex < pollInfo.options.length) {
                    const voteCount = reaction.count - 1;
                    resultsEmbed.addFields(
                        { name: `${pollInfo.options[optionIndex]} (${emoji})`, value: `${voteCount}票`, inline: true }
                    );
                }
            })
        };
        message.channel.send({ embeds: [resultsEmbed] });

        // 投票のメッセージを削除し、マップから投票情報を削除
        message.channel.messages.fetch(pollInfo.messageId)
            .then((msg) => {
                if (msg) {
                    msg.delete();
                    polls.delete(pollId);
                }
            })
            .catch((error) => {
                console.error('メッセージの取得中にエラーを出力：', error);
                message.reply('投票のメッセージを削除できませんでした。');
            });
    } else if (command === 'pollresults') {
        const pollId = args[0];
        const pollInfo = polls.get(pollId);

        if (!pollInfo) {
            message.reply('指定したIDの投票が見つかりません。');
            return;
        }

        const resultsEmbed = new EmbedBuilder()
            .setTitle(`投票結果 - ${pollId}`)
            .setColor('#00ff00');

        const reactions = message.channel.messages.cache.get(pollInfo.messageId).reactions.cache;
        reactions.forEach((reaction, index) => {
            if (index < pollInfo.options.length) {
                resultsEmbed.addField(
                    { name: `${pollInfo.options[index]} (${getEmoji(index + 1)})`, value: `${reaction.count - 1}票`, inline: true }
                );
            }
        });

        message.channel.send({ embeds: [resultsEmbed] });
    }
});

function getEmoji(index) {
    const numberEmoji = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
    return numberEmoji[index - 1];
}

function generateRandomId() {
    return Math.random().toString(36).substr(2, 5); // ランダムな5文字のIDを生成
}

// "TOKEN"の中のTOKENを読み込む
client.login("TOKEN");