import { GoogleGenAI } from '@google/genai';
import wikiData from './wikiData.json' with { type: 'json' };

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });



function findRelevantData(query, data) {
    const normalizedQuery = query.toLowerCase().trim();

    return data
        .filter(({ name, id }) =>
            name.toLowerCase().includes(normalizedQuery) ||
            id.toLowerCase().includes(normalizedQuery)
        )
        .map(({ name, stats, dropSources }) => ({
            name,
            stats,
            dropSources
        }))
        .slice(0, 3);
}


export async function aiQuery(interaction, userPrompt) {
    let ctx = findRelevantData(userPrompt, wikiData);

    if (!ctx.length) {
        ctx = "Položka nebyla nalezena v databázi!"
    }

    const token = interaction.token;
    try {

        const aiResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            systemInstruction: `Jsi herní průvodce. Jako odpověď použij data z ${JSON.stringify(ctx)}. Odpovídej stručně, maximálně 2000 znaků. Používej češtinu.`,
            contents: [
                {
                    role: 'user',
                    parts: [{ text: userPrompt }],
                },
            ],
        });

        await fetch(`https://discord.com/api/v10/webhooks/${process.env.DISCORD_APP_ID}/${token}/messages/@original`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                embeds: [{
                    title: "Herní průvodce",
                    description: aiResponse.text,
                    color: 0x00ffff,
                }]
            })

        })
    } catch (err) {
        console.error(`Gemini error: ${err}`);
        await fetch(`https://discord.com/api/v10/webhooks/${process.env.DISCORD_APP_ID}/${token}/messages/@original`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: "❌ Omlouvám se, ale zkus to znovu později..."
            })
        })
    }
}
