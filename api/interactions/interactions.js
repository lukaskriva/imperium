import dayjs from "dayjs";
import { InteractionResponseType, InteractionType } from "discord-interactions";
import { aiQuery } from "./gemini.js"; // interakce ai
import { createSelectionEmbed, MAX_MEMBERS } from "./utils.js";

const roleToMention = process.env.DISCORD_ROLE_ID;

export async function handleInteraction(interaction) {
    const { type, data, member } = interaction;

    if (type === InteractionType.APPLICATION_COMMAND) {
        // Začátek kodu pro ai interakci
        if (data.name === "wiki") {
            const userPrompt = data.options.find(opt => opt.name === "dotaz").value;

            const initialResponse = { type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE };
      
            aiQuery(interaction, userPrompt);
     

            return initialResponse;
        }
        // Konec kódu pro ai interakci

        if (data.name === "drak") {
            const minutes = data.options.find((opt) => opt.name === "cas").value;
            const startTime = dayjs().add(minutes, "minute").unix();

            return {
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    content: `<@&${roleToMention}>`,
                    ...createSelectionEmbed([member.user.id], false, startTime),
                },
            };
        }
    }

    if (type === InteractionType.MESSAGE_COMPONENT) {
        const userId = member.user.id;
        const [action, idsPart, timePart] = data.custom_id.split(":");
        const startTime = timePart;
        let userIds = idsPart ? idsPart.split(",") : [];
        const authorId = userIds[0];

        if (action === "join_action") {
            if (userIds.includes(userId)) {
                return {
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: { content: "Už jsi na seznamu!", flags: 64 },
                };
            }

            if (userIds.length >= MAX_MEMBERS) {
                return {
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: { content: "Výprava je už plná!", flags: 64 },
                };
            }

            userIds.push(userId);
        }

        if (action === "leave_action") {
            if (userId === authorId) {
                return {
                    type: InteractionResponseType.UPDATE_MESSAGE,
                    data: createSelectionEmbed([], true),
                };
            }

            if (!userIds.includes(userId)) {
                return {
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: { content: "Nejsi na seznamu..", flags: 64 },
                };
            }

            userIds = userIds.filter((id) => id !== userId);
        }

        return {
            type: InteractionResponseType.UPDATE_MESSAGE,
            data: createSelectionEmbed(userIds, false, startTime),
        };
    }
}
