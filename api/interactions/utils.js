import { verifyKey } from "discord-interactions";

export const MAX_MEMBERS = 3;


export async function verifyDiscordRequest(req, rawBody) {
    console.log(process.env.DISCORD_PUBLIC_KEY)
    const signature = req.headers['x-signature-ed25519'];
    const timestamp = req.headers['x-signature-timestamp'];
    if (!signature || !timestamp) return false;
    return await verifyKey(rawBody, signature, timestamp, process.env.DISCORD_PUBLIC_KEY);
}


export function createSelectionEmbed(userIds = [], isCancelled = false, startTime = 10) {
    if (isCancelled) {
        return {
            embeds: [{
                title: "❌ Výprava zrušena!",
                description: `Vůdce opustil výpravu, akce byla ukončena.`,
                color: 0xff0000
            }],
            components: []
        }
    }
    const mentionsList = userIds.map((id, index) =>
        index === 0 ? `👑 <@${id}>` : `🗡️ <@${id}>`
    )



    const mentionsString = mentionsList.join('\n');
    const startTimeUnix = `<t:${startTime}:R>`

    const dataPayload = `${userIds.join(',')}:${startTime}`;



    return {
        embeds: [{
            title: "🐉 DUNGEON: KOSTLIVÝ DRAK",
            description: `Hráč <@${userIds[0]}> svolává družinu k bráně dungeonu!\n\n**Sraz u brány:** ${startTimeUnix}\n\u200b`,
            fields: [{
                name: `👥 **Přihlášení hrdinové** (${userIds.length} / ${MAX_MEMBERS}):`,
                value: mentionsString,
                inline: false
            }],
            color: 0x5865F2,
            image: { url: "https://emtgen2-wiki-git-main-iportoks-projects.vercel.app/imgs/boss_12.png" }
        }],
        components: [{
            type: 1,
            components: [{
                type: 2,
                style: 3,
                label: "✅ Přidat se",
                custom_id: `join_action:${dataPayload}`,
                disabled: userIds.length >= MAX_MEMBERS
            }, {
                type: 2,
                style: 4,
                label: "❌ Odhlásit se",
                custom_id: `leave_action:${dataPayload}`
            }]
        }]
    }
}


