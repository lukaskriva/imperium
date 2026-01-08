import { GoogleGenAI } from '@google/genai';
import wikiData from './wikiData.json' with { type: 'json' };

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function aiQuery(interaction, userPrompt) {
    const token = interaction.token;
    try {

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    role: 'user',
                    parts: [{ text: userPrompt }],
                },
            ],
            config: {
                systemInstruction: `Jsi herní průvodce. Tvé znalosti jsou: ${JSON.stringify(wikiData)}. Vždy odpovídáš krátce a k věci. Maximálně 2000 znaků.`
            },
        });

        let aiResponse = response.candidates?.[0]?.content?.parts?.[0]?.text || "Nepodařilo se mi získat odpověď.";

        if (aiResponse.length > 4000) {
            aiResponse = `${aiResponse.substring(0, 3997)}...`;
        }

        await fetch(`https://discord.com/api/v10/webhooks/${process.env.DISCORD_APP_ID}/${token}/messages/@original`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                embeds: [{
                    title: "Herní průvodce",
                    description: aiResponse,
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
