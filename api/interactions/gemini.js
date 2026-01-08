import { GoogleGenAI } from '@google/genai';
import wikiData from './wikiData.json' with { type: 'json' };

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function aiQuery(interaction, userPrompt) {
    const token = interaction.token;
    try {

        const aiResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            // systemInstruction: `Jsi herní průvodce. Tvé znalosti o hře jsou: ${wikiData}. Odpovídej stručně, maximálně 2000 znaků. Používej češtinu.`,
            contents: [
                {
                    role: 'user',
                    parts: [{ userPrompt }],
                },
            ],
        });
        console.log(aiResponse);
        await fetch(`https://discord.com/api/v10/webhooks/${process.env.DISCORD_APP_ID}/${token}/messages/@original`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                embeds: [{
                    title: "Herní průvodce",
                    description: aiResponse.text(),
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
