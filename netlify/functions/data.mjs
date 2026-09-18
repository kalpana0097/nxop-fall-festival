import { getStore } from "@netlify/blobs";

const EMPTY = {
  signups: { entrees: [], appetizers: [], sides: [], desserts: [], drinks: [], supplies: [] },
  rsvpList: []
};

const headers = { "Content-Type": "application/json" };

async function getData(store) {
  try {
    const raw = await store.get("data");
    return raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(EMPTY));
  } catch {
    return JSON.parse(JSON.stringify(EMPTY));
  }
}

export default async (req) => {
  const store = getStore("festival");

  if (req.method === "GET") {
    const data = await getData(store);
    return new Response(JSON.stringify(data), { headers });
  }

  if (req.method === "POST") {
    const body = await req.json();
    const data = await getData(store);

    if (body.action === "addPotluck" && data.signups[body.category]) {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
      data.signups[body.category].push({ id, name: body.name, dish: body.dish });
    } else if (body.action === "removePotluck") {
      for (const cat of Object.keys(data.signups)) {
        data.signups[cat] = data.signups[cat].filter(item => item.id !== body.id);
      }
    } else if (body.action === "addRSVP") {
      data.rsvpList.push(body.name);
    } else {
      return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers });
    }

    await store.set("data", JSON.stringify(data));
    return new Response(JSON.stringify({ success: true }), { headers });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config = { path: "/api/data" };
