import express, { Application } from "express";
import socketIO, { Server as SocketIOServer } from "socket.io";
import { createServer, Server as HTTPServer } from "http";
import https from "https";
import path from "path";

export class Server {
  private httpServer: HTTPServer;
  private app: Application;
  private io: SocketIOServer;
  private activeSockets: string[] = [];

  private readonly DEFAULT_PORT = process.env.PORT || "5000";

  constructor() {
    this.initialize();

    this.configureApp();
    this.handleRoutes();
    this.handleSocketConnection();
  }

  private initialize(): void {
    this.app = express();
    this.httpServer = https.createServer(this.app);
    this.io = socketIO(this.httpServer);
  }

  private handleRoutes(): void {
    this.app.get("/", (req, res) => {
      res.send(`<h1>Hello World</h1>`);
    });
  }

  private handleSocketConnection(): void {
    this.io.on("connection", (socket) => {
      socket.on("disconnect", () => {
        this.activeSockets = this.activeSockets.filter(
          (existingSocket) => existingSocket !== socket.id
        );
        socket.broadcast.emit("remove-user", {
          socketId: socket.id,
        });
      });

      socket.on("call-user", (data) => {
        socket.to(data.to).emit("call-made", {
          offer: data.offer,
          socket: socket.id,
        });
      });

      socket.on("make-answer", (data) => {
        socket.to(data.to).emit("answer-made", {
          socket: socket.id,
          answer: data.answer,
        });
      });

      const existingSocket = this.activeSockets.find(
        (existingSocket) => existingSocket === socket.id
      );

      if (!existingSocket) {
        this.activeSockets.push(socket.id);

        socket.emit("update-user-list", {
          users: this.activeSockets.filter(
            (existingSocket) => existingSocket !== socket.id
          ),
        });

        socket.broadcast.emit("update-user-list", {
          users: [socket.id],
        });
      }
    });
  }

  public listen(callback: (port: string) => void): void {
    this.httpServer.listen(this.DEFAULT_PORT, () =>
      callback(this.DEFAULT_PORT)
    );
  }

  private configureApp(): void {
    this.app.use(express.static(path.join(__dirname, "../public")));
  }
}
