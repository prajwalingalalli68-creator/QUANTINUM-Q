import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;
  const httpServer = createServer(app);
  
  // Setup Socket.IO
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Store spreadsheet data in memory
  // In a real app, this would be in a database
  const spreadsheets: Record<string, any> = {};

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("join-spreadsheet", (sheetId: string) => {
      socket.join(sheetId);
      console.log(`User ${socket.id} joined spreadsheet ${sheetId}`);
      
      // Send current state if it exists
      if (spreadsheets[sheetId]) {
        socket.emit("spreadsheet-init", spreadsheets[sheetId]);
      }

      // Broadcast user count
      const room = io.sockets.adapter.rooms.get(sheetId);
      const count = room ? room.size : 1;
      io.to(sheetId).emit("user-joined", count);
    });

    socket.on("spreadsheet-update", (data: { sheetId: string, cells: any }) => {
      // Update server state
      spreadsheets[data.sheetId] = data.cells;
      
      // Broadcast to all other clients in the room
      socket.to(data.sheetId).emit("spreadsheet-updated", data.cells);
    });

    socket.on("disconnecting", () => {
      for (const room of socket.rooms) {
        if (room !== socket.id) {
          const roomObj = io.sockets.adapter.rooms.get(room);
          const count = roomObj ? roomObj.size - 1 : 0;
          io.to(room).emit("user-left", count);
        }
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
