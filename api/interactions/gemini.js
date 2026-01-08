import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function aiQuery(interaction, userPrompt) {
    const token = interaction.token;
    try {

        const aiResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            systemInstruction: `Odpovídej stručně a rychle, maximálně 200 znaků. Používej češtinu.`,
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
