import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server, Socket } from "socket.io";

dotenv.config();
// const server = express();
const PORT = process.env.PORT;
// const serverHttp = createServer(server);
const serverHttp = createServer();
const socketIo = new Server(serverHttp, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// server.use(express.json());

const emailToSocketIdMap = new Map();
const socketIdtoEmailMap = new Map();

const routes = express.Router();

routes.get("/", (req: Request, res: Response) => {
  console.log("Chegou");
  res.status(200).send({ message: "Chegou" });
});

// server.use(routes);

socketIo.on("connection", (socket: Socket) => {
  console.log("Socket connected", socket.id);

  socket.on("room:join", (data) => {
    const { email, room } = data;
    console.log("Email and room");
    console.log(email, room);
    emailToSocketIdMap.set(email, socket.id);
    socketIdtoEmailMap.set(socket.id, email);
    socketIo.to(room).emit("user:joined", { email, id: socket.id });
    socket.join(room);
    socketIo.to(socket.id).emit("room:join", data);
  });

  socket.on("user:call", ({ to, offer }) => {
    socketIo.to(to).emit("incoming:call", { from: socket.id, offer });
  });

  socket.on("call:accepted", ({ to, ans }) => {
    socketIo.to(to).emit("call:accepted", { from: socket.id, ans });
  });

  socket.on("peer:nego:needed", ({ to, offer }) => {
    socketIo.to(to).emit("peer:nego:needed", { from: socket.id, offer });
  });

  socket.on("peer:nego:done", ({ to, ans }) => {
    socketIo.to(to).emit("peer:nego:final", { from: socket.id, ans });
  });

  socket.on("call:ended", ({ to }) => {
    socketIo.to(to).emit("call:ended");
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected", socket.id);
    const email = socketIdtoEmailMap.get(socket.id);
    if (email) {
      emailToSocketIdMap.delete(email);
      socketIdtoEmailMap.delete(socket.id);
    }
  });
});

serverHttp.listen(3000);

// server.listen(PORT, () => {
//   console.log(`Servidor Executando na porta ${PORT}`);
// });
