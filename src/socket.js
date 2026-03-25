import { io } from "socket.io-client";
const SOCKET_URL = import.meta.env.VITE_BACKEND_URL.replace("/api", "");
// console.log("🔌 SOCKET_URL =", SOCKET_URL);
export const socket = io(SOCKET_URL, {
  transports: ["websocket"],
  autoConnect: false,
});
