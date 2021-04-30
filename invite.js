const { Collection, Client } = require("discord.js");
const ayarlar = require("./ayarlar.json");
const Database = require("./Helpers/Database");
const Discord = require("discord.js");
const client = new Client();

const Invites = new Collection();

client.on("ready", () => {
  client.guilds.cache.forEach(guild => {
    guild
      .fetchInvites()
      .then(_invites => {
        Invites.set(guild.id, _invites);
      })
      .catch(err => {});
  });
});
client.on("inviteCreate", invite => {
  var gi = Invites.get(invite.guild.id);
  gi.set(invite.code, invite);
  Invites.set(invite.guild.id, gi);
});
client.on("inviteDelete", invite => {
  var gi = Invites.get(invite.guild.id);
  gi.delete(invite.code);
  Invites.set(invite.guild.id, gi);
});

client.on("guildCreate", guild => {
  guild
    .fetchInvites()
    .then(invites => {
      Invites.set(guild.id, invites);
    })
    .catch(e => {});
});

client.on("guildMemberAdd", member => {
  const db = new Database("Invites"),
    gi = (Invites.get(member.guild.id) || new Collection()).clone(),
    settings = new Database("Settings").get("settings") || {};
  var guild = member.guild,
    fake =
      (Date.now() - member.createdAt) / (1000 * 60 * 60 * 24) <= 3
        ? true
        : false,
    channel = guild.channels.cache.get(ayarlar.davetkanal);
  guild
    .fetchInvites()
    .then(invites => {
      var invite =
        invites.find(_i => gi.has(_i.code) && gi.get(_i.code).uses < _i.uses) ||
        gi.find(_i => !invites.has(_i.code)) ||
        guild.vanityURLCode;
      Invites.set(member.guild.id, invites);
      var content = `${member} is joined the server.`,
        total = 0,
        regular = 0,
        _fake = 0,
        bonus = 0;

      if (invite.inviter) {
        db.set(`invites.${member.id}.inviter`, invite.inviter.id);
        if (fake) {
          total = db.add(`invites.${invite.inviter.id}.total`, 1);
          _fake = db.add(`invites.${invite.inviter.id}.fake`, 1);
        } else {
          total = db.add(`invites.${invite.inviter.id}.total`, 1);
          regular = db.add(`invites.${invite.inviter.id}.regular`, 1);
        }
        var im = guild.member(invite.inviter.id);
        bonus = db.get(`invites.${invite.inviter.id}.bonus`) || 0;
        if (im)
          global.onUpdateInvite(im, guild.id, Number(total + Number(bonus)));
      }

      db.set(`invites.${member.id}.isfake`, fake);

      if (channel) {
        channel.send(
          new Discord.MessageEmbed()
            .setColor("GREEN")
            .setDescription(
              `**${member.user.tag}(\`${
                member.user.id
              }\`)** adlı kullanıcı sunucuya katıldı. Kullanıcıyı davet eden **${
                invite.inviter.tag
              }(\`${invite.inviter.id}\`)** kişisininin (${total +
                bonus}) daveti oldu.`
            )
        );
      }
    })
    .catch();
});

client.on("guildMemberRemove", member => {
  const db = new Database("Invites"),
    settings = new Database("Settings").get("settings") || {};
  var total = 0,
    bonus = 0,
    regular = 0,
    fakecount = 0,
    channel = member.guild.channels.cache.get(ayarlar.davetkanal),
    data = db.get(`invites.${member.id}`);
  if (!data) {
    return;
  }
  if (data === null) data = "Bulunamadı";
  if (data.isfake && data.inviter) {
    fakecount = db.sub(`invites.${data.inviter}.fake`, 1);
    total = db.sub(`invites.${data.inviter}.total`, 1);
  } else if (data.inviter) {
    regular = db.sub(`invites.${data.inviter}.regular`, 1);
    total = db.sub(`invites.${data.inviter}.total`, 1);
  }
  if (data.inviter) bonus = db.get(`invites.${data.inviter}.bonus`) || 0;

  var im = member.guild.member(data.inviter);
  if (im)
    global.onUpdateInvite(im, member.guild.id, Number(total) + Number(bonus));

  db.add(`invites.${data.inviter}.leave`, 1);
  if (channel) {
    let user = client.users.cache.get(data.inviter);
    channel.send(
      new Discord.MessageEmbed()
        .setColor("RED")
        .setDescription(
          `**${member.user.tag}(\`${
            member.user.id
          }\`)** adlı kullanıcı sunucumuzdan ayrıldı. Kullanıcıyı davet eden **${
            user.tag
          }(\`${user.id}\`)** kişisinin (${Number(total) +
            Number(bonus)}) daveti kaldı!`
        )
    );
  }
});

global.onUpdateInvite = (guildMember, guild, total) => {
  if (!guildMember.manageable) return;
  const rewards =
    new Database("./Servers/" + guild, "Rewards").get("rewards") || [];
  if (rewards.length <= 0) return;
  var taken = rewards.filter(
    reward => reward.Invite > total && guildMember.roles.cache.has(reward.Id)
  );
  taken.forEach(take => {
    guildMember.roles.remove(take.Id);
  });
  var possible = rewards.filter(
    reward => reward.Invite <= total && !guildMember.roles.cache.has(reward.Id)
  );
  possible.forEach(pos => {
    guildMember.roles.add(pos.Id);
  });
};
client.login(ayarlar.token);
