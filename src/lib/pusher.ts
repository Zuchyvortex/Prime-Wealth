import Pusher from "pusher";

export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID || "dummy_app_id",
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || "dummy_key",
  secret: process.env.PUSHER_SECRET || "dummy_secret",
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "mt1",
  useTLS: true,
});
