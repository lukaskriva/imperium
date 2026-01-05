import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone.js";
import utc from "dayjs/plugin/utc.js";
import config from "./config.json" with { type: "json" };

dayjs.extend(utc);
dayjs.extend(timezone);

export default async function handler(req, res) {
	const { id, key } = req.query;
	const event = config.embeds[id];
	const roleToMention = process.env.DISCORD_ROLE_ID;

	if (!key || key !== process.env.API_KEY)
		return res.status(401).send("Access denied.");

	if (!event) return res.status(404).send(`Event with ${event} not found.`);

	let eventTime = dayjs().tz("Europe/Prague");

	if (event.startTime.day !== undefined) {
		eventTime = eventTime.day(event.startTime.day);
	}

	eventTime = eventTime
		.tz("Europe/Prague")
		.set("hour", event.startTime.hour)
		.set("minute", event.startTime.minute)
		.set("second", 0)
		.set("millisecond", 0);

	if (eventTime.isBefore(dayjs())) {
		eventTime =
			event.startTime.day !== undefined
				? eventTime.add(1, "week")
				: eventTime.add(1, "day");
	}

	const unixTime = eventTime.unix();

	const desc = event.description.replace("[TIME]", `<t:${unixTime}:F> (<t:${unixTime}:R>)`);

	try {
		const discordResponse = await fetch(process.env.DISCORD_WEBHOOK_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				username: config.botDefaults.username,
				avatar_url: config.botDefaults.avatar_url,
				content: roleToMention ? `<@&${roleToMention}>` : "",
				embeds: [
					{
						title: event.title,
						description: desc,
						color: event.color,
						footer: config.botDefaults.footer,
					},
				],
			}),
		});
		if (!discordResponse.ok) {
			res.status(400).send(discordResponse.statusText);
		}
		return res.status(200).send("Odesláno");
	} catch (err) {
		res.status(500).send(err.message, "Discord API error..");
	}
}
