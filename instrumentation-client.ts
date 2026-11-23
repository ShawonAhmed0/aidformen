import { initBotId } from "botid/client/core";

// Vercel BotID: invisible bot checks on the chat's endpoints. The server side
// of each route calls checkBotId(); this attaches the browser's proof to the
// matching requests. Skipped in development by the library itself.
initBotId({
  protect: [
    { path: "/api/chat", method: "POST" },
    { path: "/api/chat/document", method: "POST" },
  ],
});
