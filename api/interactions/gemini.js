import { GoogleGenAI } from '@google/genai';
import wikiData from './wikiData.json' with { type: 'json' };
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function aiQuery(interaction, userPrompt) {
  const token = interaction.token;
  const appId = process.env.DISCORD_APP_ID;
  const hookUrl = `https://discord.com/api/v10/webhooks/${appId}/${token}/messages/@original`;
  console.log(`[AI-DEBUG] Startuji dotaz pro: "${userPrompt}"`);
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', 
      systemInstruction: `Jsi herní průvodce. Tvé znalosti o hře jsou: ${wikiData}. Odpovídej stručně, maximálně 2000 znaků. Používej češtinu.`,
      contents: [{
        role: 'user',
        parts: [{ text: userPrompt }]
      }]
    });
    console.log("[AI-DEBUG] Odpověď od Googlu přijata.");
    let aiResponse = await response.text(); 
    console.log(`[AI-DEBUG] Vygenerovaný text (prvních 50 znaků): ${aiResponse.substring(0, 50)}...`);
    if (aiResponse.length > 4000) {
        aiResponse = aiResponse.slice(0, 3997) + '...';
    }
    const discordResponse = await fetch(hookUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: '📖 Herní průvodce',
          description: aiResponse,
          color: 0x00ffff,
          footer: { text: "Odpověď vygenerována pomocí Gemini AI" }
        }]
      })
    });

    if (discordResponse.ok) {
        console.log("[AI-DEBUG] Discord úspěšně aktualizován.");
    } else {
        const errText = await discordResponse.text();
        console.error(`[AI-DEBUG] Discord PATCH selhal: ${errText}`);
    }

  } catch (err) {
    console.error('[AI-DEBUG] Kritická chyba v aiQuery:', err);
    try {
        await fetch(hookUrl, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            content: `❌ **Chyba AI:** ${err.message || 'Neznámá chyba'}. Zkus to prosím znovu.` 
          })
        });
    } catch (fetchErr) {
        console.error('[AI-DEBUG] Nepodařilo se odeslat chybovou hlášku do Discordu:', fetchErr);
    }
  }
}
