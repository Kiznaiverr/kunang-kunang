import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import config from "../config.js";
import { Logger } from "../utils/logging.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

class OverlayServer {
  constructor(bot) {
    Logger.debug('OverlayServer: Initializing overlay server...');
    this.bot = bot;
    this.app = express();
    this.currentStatus = {
      current: null,
      queue: [],
      isPlaying: false,
      lastUpdate: Date.now(),
    };

    Logger.debug('OverlayServer: Setting up middleware...');
    this.setupMiddleware();
    Logger.debug('OverlayServer: Setting up routes...');
    this.setupRoutes();
    Logger.debug('OverlayServer: Overlay server initialization complete');
  }

  setupMiddleware() {
    const overlayPath = path.join(__dirname, "overlay");
    Logger.debug(`OverlayServer: Serving static files from ${overlayPath}`);
    this.app.use(express.static(overlayPath));

    // CORS for development
    Logger.debug('OverlayServer: Setting up CORS middleware');
    this.app.use((req, res, next) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.header("Access-Control-Allow-Headers", "Content-Type");
      next();
    });
    Logger.debug('OverlayServer: Middleware setup complete');
  }

  setupRoutes() {
    Logger.debug('OverlayServer: Setting up API routes...');
    
    // API endpoint for current status
    this.app.get("/api/nowplaying", (req, res) => {
      const overlayPreset = config.overlay?.preset || 1;
      Logger.debug(`OverlayServer: NowPlaying API called - preset: ${overlayPreset}, polling: ${config.overlay.pollingInterval}ms`);

      res.json({
        ...this.currentStatus,
        pollingInterval: config.overlay.pollingInterval,
        preset: overlayPreset,
      });
    });

    // Test endpoint for manual overlay update
    this.app.post("/api/test-update", (req, res) => {
      Logger.debug('OverlayServer: Test update API called - updating with mock data');
      
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
      Logger.debug(`OverlayServer: Test update complete - mock queue with ${mockQueue.tracks.length} tracks`);
      res.json({ success: true, message: "Overlay updated with test data" });
    });

    // Serve overlay HTML as default
    this.app.get("/", (req, res) => {
      const indexPath = path.join(__dirname, "overlay/index.html");
      Logger.debug(`OverlayServer: Root route called - serving overlay from ${indexPath}`);
      
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
        Logger.debug('OverlayServer: Served overlay HTML file');
      } else {
        Logger.debug('OverlayServer: Overlay HTML not found, serving fallback HTML');
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
    
    Logger.debug('OverlayServer: Route setup complete');
  }

  updateStatus(track, queue) {
    Logger.debug(`OverlayServer: Updating status - track: ${track?.title || 'null'}, queue tracks: ${queue?.tracks?.size || 0}`);
    
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
                .map((t) => ({
                  title: t.title,
                  author: t.author,
                  requestedBy: t.requestedBy?.username || "Unknown",
                }))
                .slice(0, config.overlay.maxQueueDisplay)
            : [],
        isPlaying: !!track,
        lastUpdate: Date.now(),
      };
      
      Logger.debug(`OverlayServer: Status updated - current: ${this.currentStatus.current?.title || 'none'}, queue: ${this.currentStatus.queue.length} tracks, playing: ${this.currentStatus.isPlaying}`);
    }, 100); // 100ms delay
  }

  start(port = config.overlay.port) {
    if (!config.overlay.enabled) {
      Logger.debug('OverlayServer: Overlay server disabled in configuration');
      Logger.warn("Overlay server disabled in config");
      return false;
    }

    Logger.debug(`OverlayServer: Starting server on port ${port}...`);
    try {
      this.server = this.app.listen(port, () => {
        Logger.info(`Overlay server running on http://localhost:${port}`);
        Logger.debug(`OverlayServer: Server started successfully on port ${port}`);
        // console.log(`Polling interval: ${config.overlay.pollingInterval}ms`);
        // console.log(`Max queue display: ${config.overlay.maxQueueDisplay} songs`);
      });
      return true;
    } catch (error) {
      Logger.error("Failed to start overlay server:", error.message);
      Logger.debug(`OverlayServer: Failed to start server on port ${port} - ${error.message}`);
      return false;
    }
  }

  stop() {
    if (this.server) {
      Logger.debug('OverlayServer: Stopping overlay server...');
      this.server.close();
      Logger.info("Overlay server stopped");
      Logger.debug('OverlayServer: Server stopped successfully');
    } else {
      Logger.debug('OverlayServer: Stop called but no server instance running');
    }
  }

  getStatus() {
    Logger.debug(`OverlayServer: Status requested - current: ${this.currentStatus.current?.title || 'none'}, queue: ${this.currentStatus.queue.length} tracks`);
    return this.currentStatus;
  }
}

export default OverlayServer;
