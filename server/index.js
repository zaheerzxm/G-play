import "dotenv/config";
import cors from "cors";
import express from "express";
import { AccessToken } from "livekit-server-sdk";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/token", async (req, res) => {
  try {
    const { room, identity, name, canPublish } = req.body;

    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL) {
      return res.status(500).json({ error: "LiveKit is not configured on the server" });
    }
    if (!room || !identity || !name) {
      return res.status(400).json({ error: "room, identity, and name are required" });
    }

    const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: String(identity),
      name: String(name),
      ttl: "6h",
    });

    token.addGrant({
      roomJoin: true,
      room: String(room),
      canPublish: Boolean(canPublish),
      canSubscribe: true,
      canPublishData: true,
    });

    const jwt = await token.toJwt();
    res.json({ token: jwt, url: LIVEKIT_URL });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create token" });
  }
});

app.listen(PORT, () => {
  console.log(`Token server http://localhost:${PORT}`);
});
