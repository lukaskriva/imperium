import { InteractionResponseType, InteractionType } from "discord-interactions";
import { handleInteraction } from "./interactions.js";
import { verifyDiscordRequest } from "./utils.js";

export default async function handler(req, res) {
    const chunks = [];
    for await (const chunk of req) {
        chunks.push(chunk);
    }
    const rawBody = Buffer.concat(chunks);

    const isValid = await verifyDiscordRequest(req, rawBody);
    if (!isValid) {
        return res.status(401).send("Invalid request signature");
    }

    const interaction = JSON.parse(rawBody.toString());

    if (interaction.type === InteractionType.PING) {
        return res.json({ type: InteractionResponseType.PONG });
    }

    try {
        const response = await handleInteraction(interaction);
        if (response) {
            return res.json(response);
        }
        return res.status(400).send("Unknown interaction");
    } catch (err) {
        console.error(err);
        return res.status(500).send("Internal Server Error");
    }
}
