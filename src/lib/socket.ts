import { io } from "socket.io-client";

export const socket = io(
  process.env.NEXT_PUBLIC_WEBSOCKET_URL || "http://localhost:3002",
  {
    autoConnect: false,
  }
);
