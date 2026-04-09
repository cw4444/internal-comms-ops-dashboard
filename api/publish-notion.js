module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  const notionKey = process.env.NOTION_API_KEY;
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!notionKey || !databaseId) {
    response.status(503).json({
      error: "Notion is not configured. Add NOTION_API_KEY and NOTION_DATABASE_ID to your environment variables."
    });
    return;
  }

  try {
    const body = request.body || {};
    const { title, owner, businessUnit, priority, draftType, draft, recommendation } = body;

    if (!title || !draft) {
      response.status(400).json({ error: "Missing required fields: title, draft." });
      return;
    }

    const notionResponse = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${notionKey}`,
        "Notion-Version": "2022-06-28"
      },
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties: {
          Name: { title: [{ text: { content: title } }] },
          ...(owner ? { Owner: { rich_text: [{ text: { content: owner } }] } } : {}),
          ...(businessUnit ? { "Business Unit": { rich_text: [{ text: { content: businessUnit } }] } } : {}),
          ...(priority ? { Priority: { rich_text: [{ text: { content: priority } }] } } : {}),
          ...(draftType ? { "Draft Type": { rich_text: [{ text: { content: draftType } }] } } : {})
        },
        children: [
          {
            object: "block",
            type: "heading_2",
            heading_2: { rich_text: [{ type: "text", text: { content: `${draftType || "Draft"}: ${title}` } }] }
          },
          ...(recommendation
            ? [
                {
                  object: "block",
                  type: "callout",
                  callout: {
                    rich_text: [
                      {
                        type: "text",
                        text: {
                          content: `Audience: ${recommendation.audience}\nChannels: ${(recommendation.channels || []).join(", ")}\nCadence: ${recommendation.cadence || "N/A"}`
                        }
                      }
                    ]
                  }
                }
              ]
            : []),
          {
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: [{ type: "text", text: { content: draft.slice(0, 2000) } }]
            }
          },
          ...(draft.length > 2000
            ? [
                {
                  object: "block",
                  type: "paragraph",
                  paragraph: {
                    rich_text: [{ type: "text", text: { content: draft.slice(2000, 4000) } }]
                  }
                }
              ]
            : [])
        ]
      })
    });

    const notionPayload = await notionResponse.json();
    if (!notionResponse.ok) {
      throw new Error(notionPayload?.message || "Notion API request failed.");
    }

    response.status(200).json({
      success: true,
      url: notionPayload.url,
      pageId: notionPayload.id
    });
  } catch (error) {
    response.status(500).json({
      error: error instanceof Error ? error.message : "Failed to publish to Notion."
    });
  }
};
