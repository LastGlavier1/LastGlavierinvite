const Discord = require("discord.js");
const Database = require("../Helpers/Database");
const ayarlar = require("../ayarlar.json");

exports.run = async (client, message, args) => {
  let logger = ayarlar.logyetkili;

  if (
    !message.member.roles.cache.get("809111646320590869") &
    !message.member.hasPermission("ADMINISTRATOR")
  )
    return message.channel.send('Komudu kullanmak için gerekli yetkiye sahip değilsin');

  let victim;
  if (message.mentions.users.first()) {
    victim = message.mentions.users.first();
  } else {
    victim = message.author;
  }

  if (!victim)
    return message.channel
      .send(
        new Discord.MessageEmbed()
          .setColor("#00ff51")
          .setDescription(
            `Davetini Görmek İstediğiniz Kişiyi Etiketlemelisiniz!`
          )
          .setTimestamp()
          .setFooter(`${message.author.tag} Tarafından Kullanıldı!`)
      )
      .then(msg => msg.delete({ timeout: 3500 }));
  victim = message.guild.member(victim);
  if (!victim)
    return message.channel
      .send(
        new Discord.MessageEmbed()
          .setColor("#ff0000")
          .setDescription(`Aradığınız Kullanıcı Sunucuda Bulunmamaktadır!`)
          .setTimestamp()
          .setFooter(`${message.author.tag} Tarafından Kullanıldı!`)
      )
      .then(msg => msg.delete({ timeout: 3500 }));

  const db = new Database("Invites");
  var data = db.get(`invites.${victim.id}`) || {
    total: 0,
    fake: 0,
    inviter: null,
    regular: 0,
    bonus: 0,
    leave: 0
  };
  var embed = new Discord.MessageEmbed()
    .setFooter("qmi Tarafından Yapılmıştır.")
    .setDescription(
      `****${victim} Kişisinin Davet İstatikleri****\n\n**Toplam:** \`${(data.total ||
        0) + (data.bonus || 0)}\` (**Düzenli** \`${data.regular ||
        0}\` **Bonus:** \`${data.bonus || 0}\` **Çıkanlar:** \`${data.leave ||
        0}\` **Sahte Olanlar:** \`${data.fake || 0}\`)`
    )
    .setColor("#f6c03d");
  message.channel.send(embed);
};
exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: ["rank"],
  permLevel: 0
};
exports.help = {
  name: "davet",
  description: "Etiketlediğiniz kişinin davet bilgilerini görürsünüz",
  usage: "davet <Kullanıcı>"
};
