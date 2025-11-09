const express = require("express");
const path = require("path");
const fs = require("fs");
const config = require("../config");

class OverlayServer {
  constructor(bot) {
    this.bot = bot;
    this.app = express();
    this.currentStatus = {
      current: null,
      queue: [],
      isPlaying: false,
      lastUpdate: Date.now(),
    };

    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    const overlayPath = path.join(__dirname, "overlay");
    this.app.use(express.static(overlayPath));

    // CORS for development
    this.app.use((req, res, next) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.header("Access-Control-Allow-Headers", "Content-Type");
      next();
    });
  }

  setupRoutes() {
    // API endpoint for current status
    this.app.get("/api/nowplaying", (req, res) => {
      // Get preset from config
      const overlayPreset = config.overlay?.preset || 1;

      res.json({
        ...this.currentStatus,
        pollingInterval: config.overlay.pollingInterval,
        preset: overlayPreset,
      });
    });

    // Test endpoint for manual overlay update
    this.app.post("/api/test-update", (req, res) => {
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
      res.json({ success: true, message: "Overlay updated with test data" });
    });

    // Serve overlay HTML as default
    this.app.get("/", (req, res) => {
      const indexPath = path.join(__dirname, "overlay/index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
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
  }

  updateStatus(track, queue) {
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
    }, 100); // 100ms delay
  }

  start(port = config.overlay.port) {
    if (!config.overlay.enabled) {
      console.log("Overlay server disabled in config");
      return false;
    }

    try {
      this.server = this.app.listen(port, () => {
        console.log(`Overlay server running on http://localhost:${port}`);
        // console.log(`Polling interval: ${config.overlay.pollingInterval}ms`);
        // console.log(`Max queue display: ${config.overlay.maxQueueDisplay} songs`);
      });
      return true;
    } catch (error) {
      console.error("Failed to start overlay server:", error.message);
      return false;
    }
  }

  stop() {
    if (this.server) {
      this.server.close();
      console.log("Overlay server stopped");
    }
  }

  getStatus() {
    return this.currentStatus;
  }
}

module.exports = OverlayServer;
