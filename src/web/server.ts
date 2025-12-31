import express, { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import config from "../config.js";
import { Logger } from "../utils/logging.js";
import { QueueRepeatMode } from "discord-player";

const __dirname = dirname(fileURLToPath(import.meta.url));

interface OverlayStatus {
  current: any;
  queue: any[];
  isPlaying: boolean;
  loopMode: string;
  lastUpdate: number;
}

class OverlayServer {
  bot: any;
  app: any;
  currentStatus: OverlayStatus;
  server: any;

  constructor(bot: any) {
    Logger.debug("OverlayServer: Initializing overlay server...");
    this.bot = bot;
    this.app = express();
    this.currentStatus = {
      current: null,
      queue: [],
      isPlaying: false,
      loopMode: "Off",
      lastUpdate: Date.now(),
    };

    Logger.debug("OverlayServer: Setting up middleware...");
    this.setupMiddleware();
    Logger.debug("OverlayServer: Setting up routes...");
    this.setupRoutes();
    Logger.debug("OverlayServer: Overlay server initialization complete");
  }

  setupMiddleware() {
    const overlayPath = path.join(__dirname, "overlay");
    Logger.debug(`OverlayServer: Serving static files from ${overlayPath}`);
    this.app.use(express.static(overlayPath));

    // CORS for development
    Logger.debug("OverlayServer: Setting up CORS middleware");
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.header("Access-Control-Allow-Headers", "Content-Type");
      next();
    });
    Logger.debug("OverlayServer: Middleware setup complete");
  }
  setupRoutes() {
    Logger.debug("OverlayServer: Setting up API routes...");

    // API endpoint for current status
    this.app.get("/api/nowplaying", (req: Request, res: Response) => {
      const overlayPreset = config.overlay?.preset || 1;
      Logger.debug(
        `OverlayServer: NowPlaying API called - preset: ${overlayPreset}, polling: ${config.overlay.pollingInterval}ms`
      );

      res.json({
        ...this.currentStatus,
        pollingInterval: config.overlay.pollingInterval,
        preset: overlayPreset,
      });
    });

    // Test endpoint for manual overlay update
    this.app.post("/api/test-update", (req: Request, res: Response) => {
      Logger.debug(
        "OverlayServer: Test update API called - updating with mock data"
      );

      // Mock track data for testing
      const mockTrack = {
        title: "Test Song - Manual Update",
        author: "Test Artist",
        thumbnail: "https://via.placeholder.com/300x300",
        duration: "3:45",
        url: "https://example.com",
        requestedBy: { username: "Tester" },
      };

      const mockQueue = {
        tracks: [
          {
            title: "Next Song 1",
            author: "Artist 1",
            requestedBy: { username: "User1" },
          },
          {
            title: "Next Song 2",
            author: "Artist 2",
            requestedBy: { username: "User2" },
          },
          {
            title: "Next Song 3",
            author: "Artist 3",
            requestedBy: { username: "User3" },
          },
        ].slice(0, config.overlay.maxQueueDisplay),
      };

      this.updateStatus(mockTrack, mockQueue);
      Logger.debug(
        `OverlayServer: Test update complete - mock queue with ${mockQueue.tracks.length} tracks`
      );
      res.json({ success: true, message: "Overlay updated with test data" });
    });

    // Serve overlay HTML as default
    this.app.get("/", (req: Request, res: Response) => {
      const indexPath = path.join(__dirname, "overlay/index.html");
      Logger.debug(
        `OverlayServer: Root route called - serving overlay from ${indexPath}`
      );

      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
        Logger.debug("OverlayServer: Served overlay HTML file");
      } else {
        Logger.debug(
          "OverlayServer: Overlay HTML not found, serving fallback HTML"
        );
        res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Kunang-Kunang Overlay</title>
                    <style>
                        body { font-family: Arial; padding: 20px; background: #000; color: #fff; }
                        .loading { text-align: center; }
                    </style>
                </head>
                <body>
                    <div class="loading">
                        <h2>Kunang-Kunang Music Overlay</h2>
                        <p>Loading overlay...</p>
                        <p>Polling interval: ${config.overlay.pollingInterval}ms</p>
                    </div>
                </body>
                </html>
                `);
      }
    });

    Logger.debug("OverlayServer: Route setup complete");
  }

  updateStatus(track: any, queue: any) {
    Logger.debug(
      `OverlayServer: Updating status - track: ${
        track?.title || "null"
      }, queue tracks: ${queue?.tracks?.size || 0}`
    );

    // Get loop status
    const getLoopStatus = (repeatMode: QueueRepeatMode): string => {
      switch (repeatMode) {
        case QueueRepeatMode.TRACK:
          return "Track";
        case QueueRepeatMode.QUEUE:
          return "Queue";
        case QueueRepeatMode.OFF:
        default:
          return "Off";
      }
    };

    // Delay update to ensure queue is updated
    setTimeout(() => {
      this.currentStatus = {
        current: track
          ? {
              title: track.title,
              author: track.author,
              thumbnail: track.thumbnail,
              duration: track.duration,
              url: track.url,
              requestedBy: track.requestedBy?.username || "Unknown",
            }
          : null,
        queue:
          queue && queue.tracks
            ? queue.tracks
                .toArray()
                .map((t: any) => ({
                  title: t.title,
                  author: t.author,
                  requestedBy: t.requestedBy?.username || "Unknown",
                }))
                .slice(0, config.overlay.maxQueueDisplay)
            : [],
        isPlaying: !!track,
        loopMode: queue ? getLoopStatus(queue.repeatMode) : "Off",
        lastUpdate: Date.now(),
      };

      Logger.debug(
        `OverlayServer: Status updated - current: ${
          this.currentStatus.current?.title || "none"
        }, queue: ${this.currentStatus.queue.length} tracks, playing: ${
          this.currentStatus.isPlaying
        }, loop: ${this.currentStatus.loopMode}`
      );
    }, 100); // 100ms delay
  }

  start(port = config.overlay.port) {
    if (!config.overlay.enabled) {
      Logger.debug("OverlayServer: Overlay server disabled in configuration");
      Logger.warn("Overlay server disabled in config");
      return false;
    }

    Logger.debug(`OverlayServer: Starting server on port ${port}...`);
    try {
      this.server = this.app.listen(port, () => {
        Logger.info(`Overlay server running on http://localhost:${port}`);
        Logger.debug(
          `OverlayServer: Server started successfully on port ${port}`
        );
        // console.log(`Polling interval: ${config.overlay.pollingInterval}ms`);
        // console.log(`Max queue display: ${config.overlay.maxQueueDisplay} songs`);
      });
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      Logger.error("Failed to start overlay server:", errorMessage);
      Logger.debug(
        `OverlayServer: Failed to start server on port ${port} - ${errorMessage}`
      );
      return false;
    }
  }

  stop() {
    if (this.server) {
      Logger.debug("OverlayServer: Stopping overlay server...");
      this.server.close();
      Logger.info("Overlay server stopped");
      Logger.debug("OverlayServer: Server stopped successfully");
    } else {
      Logger.debug("OverlayServer: Stop called but no server instance running");
    }
  }

  getStatus() {
    Logger.debug(
      `OverlayServer: Status requested - current: ${
        this.currentStatus.current?.title || "none"
      }, queue: ${this.currentStatus.queue.length} tracks`
    );
    return this.currentStatus;
  }
}

export default OverlayServer;
