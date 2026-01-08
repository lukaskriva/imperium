import { GoogleGenAI } from '@google/genai';
import wikiData from './wikiData.json' with { type: 'json' };

// Inicializace AI - ujisti se, že máš v .env GEMINI_API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function aiQuery(interaction, userPrompt) {
  const token = interaction.token;
  const appId = process.env.DISCORD_APP_ID;
  const hookUrl = `https://discord.com/api/v10/webhooks/${appId}/${token}/messages/@original`;

  console.log(`[AI-DEBUG] Startuji dotaz pro: "${userPrompt}"`);

  try {
    // 1. Kontrola modelu a parametrů
    // Používáme gemini-1.5-flash, což je nejstabilnější verze pro API
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash', 
      systemInstruction: `Jsi herní průvodce. Tvé znalosti o hře jsou: ${JSON.stringify(wikiData)}. Odpovídej stručně, maximálně 2000 znaků. Používej češtinu.`,
      contents: [{
        role: 'user',
        parts: [{ text: userPrompt }]
      }]
    });

    console.log("[AI-DEBUG] Odpověď od Googlu přijata.");

    // 2. Extrakce textu (univerzální způsob pro různé verze SDK)
    let aiResponse = "";
    try {
        // Zkusíme nejdříve metodu .text() se závorkami
        aiResponse = response.text(); 
    } catch (e) {
        // Pokud .text() selže, zkusíme přímou cestu k datům
        aiResponse = response.candidates?.[0]?.content?.parts?.[0]?.text || "Chyba: AI vrátilo prázdný výsledek.";
    }

    console.log(`[AI-DEBUG] Vygenerovaný text (prvních 50 znaků): ${aiResponse.substring(0, 50)}...`);

    // 3. Ošetření délky pro Discord Embed
    if (aiResponse.length > 4000) {
        aiResponse = aiResponse.slice(0, 3997) + '...';
    }

    // 4. Odeslání výsledku zpět do Discordu
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
    // 5. DETAILNÍ LOGOVÁNÍ CHYB
    console.error('[AI-DEBUG] Kritická chyba v aiQuery:', err);

    // Pokusíme se informovat uživatele v Discordu, že se něco pokazilo
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
