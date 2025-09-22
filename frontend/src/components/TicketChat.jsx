import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import api, { getBackendUrl } from "../api/apiService";
import useAuthStore from "../auth/useAuthStore";
import { io } from "socket.io-client";
import "../assets/galleryAnimations.css";
import "../assets/galleryResponsive.css";
import "../assets/galleryAccessibility.css";

const TicketChat = ({ ticketId }) => {
  const { user, token } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [files, setFiles] = useState([]);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryItems, setGalleryItems] = useState([]);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Gallery zoom and pan state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [imageLoading, setImageLoading] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);

  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const socketRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimerRef = useRef(null);

  // WebSocket setup for real-time chat
  useEffect(() => {
    if (!token || !ticketId) return;

    const backendUrl = getBackendUrl();
    socketRef.current = io(backendUrl);

    // Authenticate immediately after connection
    socketRef.current.on("connect", () => {
      console.log("Connected to WebSocket server");
      socketRef.current.emit("authenticate", { token });
    });

    // Handle authentication success
    socketRef.current.on("authenticated", (data) => {
      console.log("Authenticated as:", data.user.name);
      setIsAuthenticated(true);
      setError("");

      // Join the ticket room after authentication
      socketRef.current.emit("join_ticket", { ticketId });
    });

    // Handle authentication error
    socketRef.current.on("authentication_error", (data) => {
      console.error("Auth failed:", data.message);
      setError("Authentication failed: " + data.message);
      setIsAuthenticated(false);
    });

    // Handle successful ticket join
    socketRef.current.on("joined_ticket", (data) => {
      console.log("Joined ticket:", data.ticketId);
      // Load message history after joining
      socketRef.current.emit("get_messages", { ticketId });
    });

    // Handle ticket join error
    socketRef.current.on("join_ticket_error", (data) => {
      console.error("Join error:", data.message);
      setError("Failed to join chat: " + data.message);
    });

    // Handle message history loading
    socketRef.current.on("messages_loaded", (data) => {
      console.log("Messages loaded:", data.messages.length);
      setMessages(data.messages || []);
      setLoading(false);
    });

    // Handle message loading error
    socketRef.current.on("messages_error", (data) => {
      console.error("Failed to load messages:", data.message);
      setError("Failed to load messages: " + data.message);
      setLoading(false);
    });

    // Handle new messages in real-time
    socketRef.current.on("new_message", (data) => {
      const message = data.data;
      console.log("New message received:", message);
      setMessages((prev) => [...prev, message]);
    });

    // Handle message sending error
    socketRef.current.on("send_message_error", (data) => {
      console.error("Failed to send message:", data.message);
      setError("Failed to send message: " + data.message);
      setSending(false);
    });

    // Handle typing indicators
    socketRef.current.on("user_typing", (data) => {
      setTypingUsers((prev) => {
        if (!prev.includes(data.userName)) {
          return [...prev, data.userName];
        }
        return prev;
      });
    });

    socketRef.current.on("user_stopped_typing", (data) => {
      setTypingUsers((prev) => prev.filter((name) => name !== data.userName));
    });

    // Handle connection errors
    socketRef.current.on("disconnect", () => {
      console.log("Disconnected from WebSocket server");
      setIsAuthenticated(false);
      setIsReconnecting(true);
    });

    socketRef.current.on("connect_error", (error) => {
      console.error("Connection error:", error);
      setConnectionAttempts((prev) => prev + 1);
      if (connectionAttempts < 3) {
        setError("Connection error. Retrying...");
        setIsReconnecting(true);
      } else {
        setError("Unable to connect to chat server. Please refresh the page.");
        setIsReconnecting(false);
      }
    });

    // Handle reconnection
    socketRef.current.on("reconnect", () => {
      console.log("Reconnected to WebSocket server");
      setIsReconnecting(false);
      setConnectionAttempts(0);
      // Re-authenticate after reconnection
      socketRef.current.emit("authenticate", { token });
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit("leave_ticket", { ticketId });
        socketRef.current.disconnect();
      }
    };
  }, [ticketId, token, connectionAttempts]);

  // Convert file to base64 for WebSocket transmission
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Send a new message with files via WebSocket
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() && files.length === 0) return;
    if (!isAuthenticated) {
      setError("Not authenticated. Please refresh the page.");
      return;
    }

    setSending(true);
    setError("");

    try {
      const messageData = {
        ticketId,
        message: input.trim(),
      };

      // Handle file attachments
      if (files.length > 0) {
        const attachments = [];
        for (const file of files) {
          if (file.size > 10 * 1024 * 1024) {
            setError(`File ${file.name} is too large (max 10MB)`);
            setSending(false);
            return;
          }

          const base64Data = await fileToBase64(file);
          attachments.push({
            name: file.name,
            type: file.type,
            data: base64Data.split(",")[1], // Remove data:mime;base64, prefix
          });
        }
        messageData.attachments = attachments;
      }

      // Send via WebSocket
      socketRef.current.emit("send_message", messageData);

      // Clear input and files on successful send
      setInput("");
      setFiles([]);
      setSending(false);

      // Stop typing indicator
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
        socketRef.current.emit("typing_stop", { ticketId });
      }
    } catch (err) {
      console.error("Error preparing message:", err);
      setError("Error preparing message: " + err.message);
      setSending(false);
    }
  };

  // Handle typing indicators
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);

    if (isAuthenticated && ticketId) {
      // If input is not empty, emit typing_start
      if (value.length > 0) {
        socketRef.current.emit("typing_start", { ticketId });
        // Clear existing timer
        if (typingTimerRef.current) {
          clearTimeout(typingTimerRef.current);
        }
        // Set new timer to stop typing after 1 second of inactivity
        typingTimerRef.current = setTimeout(() => {
          socketRef.current.emit("typing_stop", { ticketId });
        }, 1000);
      } else {
        // If input is empty, emit typing_stop immediately
        socketRef.current.emit("typing_stop", { ticketId });
        if (typingTimerRef.current) {
          clearTimeout(typingTimerRef.current);
        }
      }
    }
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files).filter(
      (file) => file.size <= 10 * 1024 * 1024
    );
    if (selected.length !== e.target.files.length) {
      setError("Some files were too large (max 10MB each).");
    }
    setFiles([...files, ...selected]);
    // Reset file input to allow selecting the same file again
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Handle paste image from clipboard
  useEffect(() => {
    const handlePaste = (event) => {
      if (event.clipboardData && event.clipboardData.files) {
        const imageFiles = Array.from(event.clipboardData.files).filter(
          (file) => file.type.startsWith("image/")
        );
        if (imageFiles.length > 0) {
          setFiles((prev) => [...prev, ...imageFiles]);
        }
      }
    };
    // Attach to input only
    const input = inputRef.current;
    if (input) {
      input.addEventListener("paste", handlePaste);
    }
    return () => {
      if (input) {
        input.removeEventListener("paste", handlePaste);
      }
    };
  }, []);

  // Format timestamp
  const formatTime = (ts) => {
    if (!ts) return "";
    return new Date(ts).toLocaleString();
  };

  // Open gallery view
  const openGallery = (attachments, index) => {
    // Store current scroll position
    setScrollPosition(window.pageYOffset || document.documentElement.scrollTop);

    setGalleryItems(attachments);
    setGalleryIndex(index);
    setShowGallery(true);
  };

  // Helper to get absolute asset URL - improved for consistency with diagnostic logging
  const getAssetUrl = (att) => {
    // Log received attachment to help diagnose issues
    console.log("Processing attachment:", {
      hasUrl: !!att.url,
      hasAssetUrl: !!att.assetUrl,
      hasPath: !!att.path,
      filename: att.filename || att.originalname,
      mimetype: att.mimetype,
      type: att.type,
    });

    // First priority: direct URL from backend
    if (att.url) {
      console.log("Using direct URL from backend:", att.url);
      return att.url;
    }

    // Second priority: legacy assetUrl field
    if (att.assetUrl) {
      console.log("Using legacy assetUrl field:", att.assetUrl);
      return att.assetUrl;
    }

    // Final fallback: construct URL from path
    if (att.path) {
      const backendBase = getBackendUrl();
      const cleanPath = att.path.replace(/\\/g, "/");
      let constructedUrl;

      // Make sure the path starts with /uploads/ for consistency
      if (cleanPath.includes("/uploads/")) {
        const pathParts = cleanPath.split("/uploads/");
        constructedUrl = `${backendBase}/uploads/${
          pathParts[1] || pathParts[0]
        }`;
      } else {
        constructedUrl = `${backendBase}${
          cleanPath.startsWith("/") ? "" : "/"
        }${cleanPath}`;
      }

      console.log("Constructed URL from path:", constructedUrl);
      return constructedUrl;
    }

    // If no valid URL can be constructed, return a placeholder
    console.error("Unable to determine URL for attachment:", att);
    return null;
  };

  // Handle keyboard navigation for gallery
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!showGallery) return;

      switch (e.key) {
        case "ArrowRight":
          setGalleryIndex((prev) =>
            prev === galleryItems.length - 1 ? 0 : prev + 1
          );
          break;
        case "ArrowLeft":
          setGalleryIndex((prev) =>
            prev === 0 ? galleryItems.length - 1 : prev - 1
          );
          break;
        case "Escape":
          setShowGallery(false);
          break;
        case "+":
          handleZoomIn();
          break;
        case "-":
          handleZoomOut();
          break;
        case "0":
          handleResetZoom();
          break;
        default:
          break;
      }
    };

    if (showGallery) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showGallery, galleryItems.length, galleryIndex]);

  // Reset zoom when changing images and handle body scroll
  useEffect(() => {
    if (showGallery) {
      handleResetZoom();
      // Prevent body scroll when gallery is open
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      // Restore body scroll when gallery is closed
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }

    // Cleanup function
    return () => {
      if (showGallery) {
        document.body.style.overflow = "";
        document.body.style.paddingRight = "";
      }
    };
  }, [showGallery]);

  // Zoom handling functions
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 1));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setDragOffset({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoomLevel > 1) {
      setDragOffset({
        x: dragOffset.x + (e.clientX - dragStart.x) / zoomLevel,
        y: dragOffset.y + (e.clientY - dragStart.y) / zoomLevel,
      });
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch event handlers for swipe gestures and pinch zoom
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [touchEnd, setTouchEnd] = useState({ x: 0, y: 0 });
  const [swiping, setSwiping] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [initialDistance, setInitialDistance] = useState(null);
  const [initialZoom, setInitialZoom] = useState(1);

  // Handle touch start for swiping and pinch zoom
  const handleTouchStart = (e) => {
    // Check if it's a pinch gesture (two fingers)
    if (
      e.touches.length === 2 &&
      galleryItems[galleryIndex]?.mimetype?.startsWith("image/")
    ) {
      // It's a pinch - store the initial distance between fingers
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];

      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      setInitialDistance(distance);
      setInitialZoom(zoomLevel);
      e.preventDefault(); // Prevent default to avoid browser zoom
      return;
    }

    // It's a single touch - check if we should process as swipe
    if (zoomLevel > 1) return; // Disable swiping when zoomed in

    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    });
    setSwiping(true);
  };

  // Handle touch move for swiping and pinch zoom
  const handleTouchMove = (e) => {
    // Check if it's a pinch gesture (two fingers)
    if (
      e.touches.length === 2 &&
      initialDistance !== null &&
      galleryItems[galleryIndex]?.mimetype?.startsWith("image/")
    ) {
      // It's a pinch - calculate new zoom level based on finger distance
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];

      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      // Calculate scale factor and apply zoom constraints
      const scale = distance / initialDistance;
      const newZoomLevel = Math.min(Math.max(initialZoom * scale, 1), 3);

      setZoomLevel(newZoomLevel);
      e.preventDefault();
      return;
    }

    // Single touch - handle as swipe if appropriate
    if (!swiping || zoomLevel > 1) return;

    setTouchEnd({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    });
  };

  // Handle touch end for swiping and pinch zoom
  const handleTouchEnd = () => {
    // Reset pinch zoom tracking
    if (initialDistance !== null) {
      setInitialDistance(null);
      return;
    }

    // Process swipe if applicable
    if (!swiping || zoomLevel > 1) return;

    const xDiff = touchStart.x - touchEnd.x;
    const yDiff = touchStart.y - touchEnd.y;

    // Only trigger if horizontal swipe is more significant than vertical swipe
    if (Math.abs(xDiff) > Math.abs(yDiff) && Math.abs(xDiff) > 50) {
      // Horizontal swipe - right to left (next)
      if (xDiff > 0) {
        setSwipeDirection("left");
        setGalleryIndex((prev) =>
          prev === galleryItems.length - 1 ? 0 : prev + 1
        );
      }
      // Horizontal swipe - left to right (previous)
      else {
        setSwipeDirection("right");
        setGalleryIndex((prev) =>
          prev === 0 ? galleryItems.length - 1 : prev - 1
        );
      }
    }

    setSwiping(false);
  };

  // Reset swipe direction after animation
  useEffect(() => {
    if (swipeDirection) {
      const timer = setTimeout(() => {
        setSwipeDirection(null);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [swipeDirection]);

  // Reset loading state and announce for screen readers when gallery index changes
  useEffect(() => {
    if (showGallery && galleryItems.length > 0) {
      const currentItem = galleryItems[galleryIndex];

      // Only set loading for images
      if (currentItem?.mimetype?.startsWith("image/")) {
        setImageLoading(true);
      }

      // Announce to screen readers that the image has changed
      const announcer = document.getElementById("gallery-announcer");
      if (announcer) {
        const fileName =
          currentItem.originalname || currentItem.filename || "File attachment";
        const fileType = currentItem.mimetype?.startsWith("image/")
          ? "Image"
          : currentItem.mimetype?.startsWith("video/")
          ? "Video"
          : "File";

        announcer.textContent = `${fileType} ${galleryIndex + 1} of ${
          galleryItems.length
        }: ${fileName}`;
      }
    }
  }, [galleryIndex, showGallery, galleryItems]);

  // Handle double-tap to zoom on mobile
  const [lastTap, setLastTap] = useState(0);
  const handleDoubleTap = (e) => {
    // Only work for images
    if (!galleryItems[galleryIndex]?.mimetype?.startsWith("image/")) return;

    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300; // 300ms

    if (now - lastTap < DOUBLE_TAP_DELAY) {
      // It's a double tap
      e.preventDefault();

      if (zoomLevel > 1) {
        // Reset zoom if already zoomed
        setZoomLevel(1);
        setDragOffset({ x: 0, y: 0 });
      } else {
        // Zoom to 2x at tap position
        setZoomLevel(2);

        // Try to center zoom around tap point (advanced feature)
        const image = e.target;
        if (image.tagName === "IMG") {
          const rect = image.getBoundingClientRect();
          // Calculate relative position of tap within image (as percentage)
          const xRelative = (e.touches[0].clientX - rect.left) / rect.width;
          const yRelative = (e.touches[0].clientY - rect.top) / rect.height;

          // Calculate offset to center the tapped point
          // This is a simplified calculation; might need adjustment
          const xOffset = (xRelative - 0.5) * 100;
          const yOffset = (yRelative - 0.5) * 100;

          setDragOffset({ x: -xOffset, y: -yOffset });
        }
      }
    }

    setLastTap(now);
  };

  // Display touch hint on first gallery open for mobile devices
  useEffect(() => {
    // Only run on mobile devices
    const isMobileDevice =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

    // Only show the hint if it's a mobile device and gallery is shown
    if (isMobileDevice && showGallery && galleryItems.length > 1) {
      // Check if we've already shown the hint before (using session storage)
      const hasShownHint = sessionStorage.getItem("galleryTouchHintShown");

      if (!hasShownHint) {
        // Find the hint element after the component is mounted
        setTimeout(() => {
          const hintElement = document.querySelector(".gallery-touch-hint");
          if (hintElement) {
            hintElement.classList.add("show");

            // Add click handler to dismiss the hint
            hintElement.addEventListener(
              "click",
              () => {
                hintElement.classList.remove("show");
              },
              { once: true }
            );

            // Auto-hide after animation completes
            setTimeout(() => {
              if (hintElement) {
                hintElement.classList.remove("show");
              }
            }, 3000);

            // Mark as shown in session storage
            sessionStorage.setItem("galleryTouchHintShown", "true");
          }
        }, 500);
      }
    }
  }, [showGallery, galleryItems.length]);

  // Render the media gallery modal - improved user experience with animations and mobile responsiveness
  const renderGallery = () => {
    if (!showGallery || galleryItems.length === 0) return null;

    const currentItem = galleryItems[galleryIndex];
    const isImage = currentItem.mimetype?.startsWith("image/");
    const isVideo = currentItem.mimetype?.startsWith("video/");
    const url = getAssetUrl(currentItem);

    // Determine if it's from the current user (for displaying info)
    const fileName =
      currentItem.originalname || currentItem.filename || "File attachment";

    const modalContent = (
      <div
        className="gallery-modal gallery-overlay"
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        role="dialog"
        aria-modal="true"
        aria-label="Image Gallery"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 99999,
          backgroundColor: "rgba(0, 0, 0, 0.9)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* Announcer for screen readers */}
        <div
          id="gallery-announcer"
          className="gallery-sr-only"
          aria-live="polite"
        ></div>
        {/* Top Bar with Title and Controls */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black to-transparent z-10 gallery-slide-up gallery-top-bar">
          <div className="text-white flex items-center space-x-3 gallery-transition">
            {/* File Name */}
            <h3 className="text-lg font-medium truncate max-w-[200px] sm:max-w-[300px] md:max-w-none gallery-title">
              {fileName}
            </h3>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 gallery-controls">
            {/* Zoom Controls - Only for images */}
            {isImage && (
              <div className="flex items-center gap-1 mr-2">
                <button
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 1}
                  className={`gallery-control-button p-2 rounded-full ${
                    zoomLevel <= 1
                      ? "bg-gray-700 text-gray-500"
                      : "bg-gray-800 hover:bg-gray-700 text-white"
                  } transition-all transform hover:scale-105`}
                  aria-label="Zoom Out"
                >
                  <svg
                    className="gallery-control-icon w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 12H4"
                    />
                  </svg>
                </button>
                <button
                  onClick={handleResetZoom}
                  className="gallery-control-button p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-white transition-all transform hover:scale-105"
                  aria-label="Reset Zoom"
                >
                  <svg
                    className="gallery-control-icon w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </button>
                <button
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 3}
                  className={`gallery-control-button p-2 rounded-full ${
                    zoomLevel >= 3
                      ? "bg-gray-700 text-gray-500"
                      : "bg-gray-800 hover:bg-gray-700 text-white"
                  } transition-all transform hover:scale-105`}
                  aria-label="Zoom In"
                >
                  <svg
                    className="gallery-control-icon w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </button>
              </div>
            )}

            {/* Download Button */}
            <a
              href={url}
              download={fileName}
              target="_blank"
              rel="noopener noreferrer"
              className="gallery-control-button p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-white transition-all transform hover:scale-105 gallery-transition"
              aria-label="Download"
              onClick={(e) => e.stopPropagation()}
            >
              <svg
                className="gallery-control-icon w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </a>

            {/* Close Button */}
            <button
              onClick={() => {
                setShowGallery(false);
              }}
              className="gallery-control-button p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-white transition-all transform hover:scale-105 gallery-transition"
              aria-label="Close"
            >
              <svg
                className="gallery-control-icon w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Main Content Area with Media */}
        <div className="flex-1 flex items-center justify-center w-full p-4 relative">
          {/* Previous Button - Absolute Positioned */}
          {galleryItems.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setGalleryIndex((prev) => {
                  const newIndex =
                    prev === 0 ? galleryItems.length - 1 : prev - 1;
                  return newIndex;
                });
                setSwipeDirection("right");
              }}
              className="gallery-nav-button absolute left-4 p-3 rounded-full bg-black bg-opacity-60 hover:bg-opacity-80 text-white transition-all transform hover:scale-110 z-10 gallery-transition gallery-controls"
              aria-label="Previous"
            >
              <svg
                className="gallery-nav-icon w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}

          {/* Touch Areas for Mobile Swipe */}
          {galleryItems.length > 1 && (
            <>
              <div
                className="gallery-touch-area-left hidden md:hidden"
                onClick={() => {
                  setGalleryIndex((prev) =>
                    prev === 0 ? galleryItems.length - 1 : prev - 1
                  );
                  setSwipeDirection("right");
                }}
              />
              <div
                className="gallery-touch-area-right hidden md:hidden"
                onClick={() => {
                  setGalleryIndex((prev) =>
                    prev === galleryItems.length - 1 ? 0 : prev + 1
                  );
                  setSwipeDirection("left");
                }}
              />
            </>
          )}

          {/* Media Container with Better Styling and Animation */}
          <div
            className={`relative max-w-full max-h-full flex items-center justify-center rounded-lg overflow-hidden gallery-image-container ${
              swipeDirection === "left"
                ? "gallery-swipe-left"
                : swipeDirection === "right"
                ? "gallery-swipe-right"
                : ""
            }`}
            style={{
              boxShadow: "0 0 20px rgba(0, 0, 0, 0.3)",
            }}
          >
            {isImage ? (
              <div
                className="relative bg-black bg-opacity-40 rounded-lg overflow-hidden"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onTouchStart={(e) => {
                  handleTouchStart(e);
                  handleDoubleTap(e);
                }}
                style={{
                  cursor:
                    zoomLevel > 1
                      ? isDragging
                        ? "grabbing"
                        : "grab"
                      : "default",
                }}
              >
                {/* Loading indicator */}
                {imageLoading && isImage && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 z-10">
                    <div className="flex flex-col items-center">
                      <svg
                        className="animate-spin h-10 w-10 text-white mb-2"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <p className="text-white text-sm">Loading image...</p>
                    </div>
                  </div>
                )}
                <img
                  src={url}
                  alt={fileName}
                  className="gallery-image max-h-[75vh] max-w-[95vw] md:max-w-[90vw] object-contain gallery-transition"
                  style={{
                    transform: `scale(${zoomLevel}) translate(${dragOffset.x}px, ${dragOffset.y}px)`,
                    transition: isDragging ? "none" : "transform 0.3s ease",
                    touchAction: zoomLevel > 1 ? "none" : "auto",
                  }}
                  onLoad={() => setImageLoading(false)}
                  onError={(e) => {
                    // Replace broken image with error message
                    const container = e.target.parentNode;
                    e.target.style.display = "none";

                    // Only add the error message if it doesn't already exist
                    if (!container.querySelector(".error-message")) {
                      const errorMsg = document.createElement("div");
                      errorMsg.className =
                        "error-message gallery-error-message flex flex-col items-center justify-center text-white bg-black bg-opacity-30 p-6 rounded-lg gallery-fade-in";
                      errorMsg.innerHTML = `
                        <svg class="w-12 h-12 text-red-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <p class="text-lg font-medium">Image could not be loaded</p>
                        <p class="text-sm opacity-80 mt-1">${
                          fileName ||
                          "The image might have been deleted or moved"
                        }</p>
                      `;
                      container.appendChild(errorMsg);
                    }
                  }}
                />

                {/* Mobile Touch Hint - Only shown on first load on touch devices */}
                <div className="gallery-touch-hint opacity-0 absolute inset-0 bg-black bg-opacity-50 pointer-events-none">
                  <div className="text-center px-4 flex flex-col items-center justify-center h-full text-white">
                    <svg
                      className="w-12 h-12 mx-auto mb-2 opacity-80"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15 19l-7-7 7-7M9 5l7 7-7 7"
                      />
                    </svg>
                    <p className="text-sm font-medium">Swipe to navigate</p>
                    <button className="mt-3 px-3 py-1.5 bg-white text-black text-xs rounded-full">
                      Got it
                    </button>
                  </div>
                </div>

                {/* Zoom Level Indicator */}
                {zoomLevel > 1 && (
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
                    {Math.round(zoomLevel * 100)}%
                  </div>
                )}

                {/* Zoom instruction */}
                {zoomLevel > 1 && (
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-lg flex items-center gallery-fade-in">
                    <svg
                      className="w-3 h-3 mr-1"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M15 5l-1.41 1.41L15 7.83 17.17 10 14 13.17l-2.17-2.17-1.41 1.41L12.58 14l-2.17 2.17 1.41 1.41L14 15.42l2.17 2.17 1.41-1.41L15.42 14l2.17-2.17-1.41-1.41L14 12.58l-2.17-2.17L13.24 9l1.76-1.76z" />
                    </svg>
                    Drag to pan
                  </div>
                )}
              </div>
            ) : isVideo ? (
              <div className="relative w-full h-full flex justify-center bg-black bg-opacity-40 rounded-lg overflow-hidden">
                <video
                  src={url}
                  controls
                  playsInline
                  autoPlay
                  className="gallery-image max-h-[75vh] max-w-[95vw] md:max-w-[90vw] gallery-transition"
                  onError={(e) => {
                    // Replace broken video with error message
                    const container = e.target.parentNode;
                    e.target.style.display = "none";

                    // Only add the error message if it doesn't already exist
                    if (!container.querySelector(".error-message")) {
                      const errorMsg = document.createElement("div");
                      errorMsg.className =
                        "error-message gallery-error-message flex flex-col items-center justify-center text-white bg-black bg-opacity-30 p-6 rounded-lg gallery-fade-in";
                      errorMsg.innerHTML = `
                        <svg class="w-12 h-12 text-red-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <p class="text-lg font-medium">Video could not be played</p>
                        <p class="text-sm opacity-80 mt-1">${
                          fileName ||
                          "The video might have been deleted or moved"
                        }</p>
                        <a href="${url}" target="_blank" rel="noopener noreferrer" class="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">Try direct link</a>
                      `;
                      container.appendChild(errorMsg);
                    }
                  }}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center bg-gray-800 p-8 rounded-lg gallery-zoom-in">
                <div className="text-7xl mb-4 gallery-pulse">📄</div>
                <p className="text-white text-xl mb-2">{fileName}</p>
                <p className="text-gray-300 text-sm mb-4">
                  {currentItem.size
                    ? `${Math.round(currentItem.size / 1024)} KB`
                    : ""}
                </p>
                <a
                  href={url}
                  download={fileName}
                  className="mt-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors gallery-transition"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download File
                </a>
              </div>
            )}
          </div>

          {/* Next Button - Absolute Positioned */}
          {galleryItems.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setGalleryIndex((prev) => {
                  const newIndex =
                    prev === galleryItems.length - 1 ? 0 : prev + 1;
                  return newIndex;
                });
                setSwipeDirection("left");
              }}
              className="gallery-nav-button absolute right-4 p-3 rounded-full bg-black bg-opacity-60 hover:bg-opacity-80 text-white transition-all transform hover:scale-110 z-10 gallery-transition gallery-controls"
              aria-label="Next"
            >
              <svg
                className="gallery-nav-icon w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Bottom Bar with Pagination and Thumbnails */}
        {galleryItems.length > 1 && (
          <div className="w-full px-4 py-3 bg-gradient-to-t from-black to-transparent gallery-slide-up gallery-bottom-bar">
            <div className="flex flex-col items-center space-y-2">
              {/* Pagination Counter */}
              <div className="text-white text-sm font-medium">
                {galleryIndex + 1} of {galleryItems.length}
              </div>

              {/* Thumbnail Strip */}
              <div className="gallery-thumbnails flex justify-center space-x-2 overflow-x-auto pb-2 max-w-full">
                {galleryItems.slice(0, 7).map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => setGalleryIndex(idx)}
                    className={`gallery-thumbnail w-12 h-12 rounded overflow-hidden gallery-thumbnail ${
                      idx === galleryIndex
                        ? "border-2 border-white scale-110 gallery-thumbnail-active"
                        : "border border-gray-600 opacity-60 hover:opacity-100"
                    }`}
                  >
                    {item.mimetype?.startsWith("image/") ? (
                      <img
                        src={getAssetUrl(item)}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : item.mimetype?.startsWith("video/") ? (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-white"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center text-white text-xs">
                        DOC
                      </div>
                    )}
                  </button>
                ))}
                {galleryItems.length > 7 && (
                  <div className="w-12 h-12 flex items-center justify-center text-white bg-gray-800 bg-opacity-70 rounded">
                    +{galleryItems.length - 7}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Keyboard Navigation Help */}
        <div className="gallery-keyboard-help absolute bottom-3 left-3 text-xs text-gray-500 flex items-center space-x-3 gallery-fade-in opacity-50 hover:opacity-100 transition-opacity">
          <div className="flex items-center">
            <kbd className="px-1 py-0.5 bg-gray-700 text-gray-300 rounded">
              ←
            </kbd>
            <kbd className="px-1 py-0.5 bg-gray-700 text-gray-300 rounded mx-1">
              →
            </kbd>
            <span className="ml-1">Navigate</span>
          </div>

          <div className="flex items-center">
            <kbd className="px-1 py-0.5 bg-gray-700 text-gray-300 rounded">
              Esc
            </kbd>
            <span className="ml-1">Close</span>
          </div>

          {isImage && (
            <>
              <div className="flex items-center">
                <kbd className="px-1 py-0.5 bg-gray-700 text-gray-300 rounded">
                  +
                </kbd>
                <kbd className="px-1 py-0.5 bg-gray-700 text-gray-300 rounded mx-1">
                  -
                </kbd>
                <span className="ml-1">Zoom</span>
              </div>

              <div className="flex items-center">
                <kbd className="px-1 py-0.5 bg-gray-700 text-gray-300 rounded">
                  0
                </kbd>
                <span className="ml-1">Reset</span>
              </div>
            </>
          )}
        </div>

        {/* Add global click handler to close on background click */}
        <div
          className="absolute inset-0 z-[-1]"
          onClick={() => {
            setShowGallery(false);
          }}
        ></div>
      </div>
    );

    // Use portal to render modal at document.body level
    return createPortal(modalContent, document.body);
  };

  // Render attachments in chat with WhatsApp-like style
  const renderAttachments = (attachments = []) => {
    if (attachments.length === 0) return null;

    // Group attachments by type
    const images = attachments.filter((att) =>
      att.mimetype?.startsWith("image/")
    );
    const videos = attachments.filter((att) =>
      att.mimetype?.startsWith("video/")
    );
    const otherFiles = attachments.filter(
      (att) =>
        !att.mimetype?.startsWith("image/") &&
        !att.mimetype?.startsWith("video/")
    );

    return (
      <div className="mt-2">
        {/* Image/Video Grid - WhatsApp style */}
        {(images.length > 0 || videos.length > 0) && (
          <div
            className={`grid gap-1 mb-2 ${
              images.length + videos.length === 1
                ? "grid-cols-1"
                : images.length + videos.length === 2
                ? "grid-cols-2"
                : images.length + videos.length === 3
                ? "grid-cols-2"
                : "grid-cols-2"
            }`}
          >
            {/* Combine and limit to 4 items with a +X overlay for more */}
            {[...images, ...videos].slice(0, 4).map((att, idx) => {
              const url = getAssetUrl(att);
              const isImage = att.mimetype?.startsWith("image/");

              // Add "show more" overlay if there are more than 4 media items
              const showMoreOverlay =
                idx === 3 && images.length + videos.length > 4;

              return (
                <div
                  key={idx}
                  onClick={() => openGallery([...images, ...videos], idx)}
                  className={`relative cursor-pointer rounded overflow-hidden ${
                    images.length + videos.length === 3 && idx === 0
                      ? "row-span-2"
                      : ""
                  }`}
                >
                  {isImage ? (
                    <div
                      className="relative w-full h-full"
                      style={{ aspectRatio: "1/1" }}
                    >
                      {url ? (
                        <img
                          src={url}
                          alt={att.originalname || "Image attachment"}
                          className="w-full h-full max-w-[15rem] object-cover"
                          style={{ aspectRatio: "1/1" }}
                          onError={(e) => {
                            // Show error icon if image fails to load
                            e.target.style.display = "none";
                            e.target.parentNode.classList.add("bg-gray-200");
                            const errorEl = document.createElement("div");
                            errorEl.className =
                              "absolute inset-0 flex items-center justify-center";
                            errorEl.innerHTML = `<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"></path>
                            </svg>`;
                            e.target.parentNode.appendChild(errorEl);
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                          <svg
                            className="w-8 h-8"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      className="relative w-full"
                      style={{ aspectRatio: "1/1" }}
                    >
                      {url ? (
                        <>
                          <video
                            src={url}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Show error icon if video fails to load
                              e.target.style.display = "none";
                              e.target.parentNode.classList.add("bg-gray-200");
                              const errorEl = document.createElement("div");
                              errorEl.className =
                                "absolute inset-0 flex flex-col items-center justify-center text-gray-500";
                              errorEl.innerHTML = `<svg class="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"></path>
                              </svg>
                              <span class="text-xs">Video unavailable</span>`;
                              e.target.parentNode.appendChild(errorEl);
                            }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
                            <div className="bg-black bg-opacity-60 rounded-full p-2">
                              <svg
                                className="w-8 h-8 text-white"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                          <svg
                            className="w-8 h-8"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  )}

                  {showMoreOverlay && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-65">
                      <span className="text-white text-xl font-bold">
                        +{images.length + videos.length - 4}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Other Files - Documents, PDFs, etc. */}
        {otherFiles.length > 0 && (
          <div className="flex flex-col gap-2">
            {otherFiles.map((att, idx) => {
              const url = getAssetUrl(att);
              // Get file extension
              const extension = att.originalname
                .split(".")
                .pop()
                ?.toUpperCase();
              return (
                <a
                  key={idx}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={att.originalname}
                  className="flex items-center gap-2 p-2 bg-gray-50 rounded-md border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-gray-200 rounded">
                    <span className="font-medium text-xs text-gray-700">
                      {extension}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {att.originalname}
                    </p>
                    <p className="text-xs text-gray-500">
                      {Math.round((att.size || 0) / 1024)} KB
                    </p>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Real-time preview for selected files with remove option and better UI
  const renderFilePreviews = () => {
    if (files.length === 0) return null;

    // Group files
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    const videoFiles = files.filter((file) => file.type.startsWith("video/"));
    const otherFiles = files.filter(
      (file) =>
        !file.type.startsWith("image/") && !file.type.startsWith("video/")
    );

    return (
      <div className="flex flex-col gap-3 mt-3 mb-3 p-3 bg-gray-50 rounded-lg border border-green-200 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-green-700 flex items-center gap-2">
            Attachments ({files.length})
          </span>
          <button
            type="button"
            onClick={() => setFiles([])}
            className="text-xs text-red-600 hover:text-red-800 font-semibold"
          >
            Clear all
          </button>
        </div>

        {/* Images Grid with Pasted Badge - full width/height */}
        {imageFiles.length > 0 && (
          <div
            className={`grid gap-3 ${
              imageFiles.length === 1
                ? "grid-cols-1"
                : imageFiles.length === 2
                ? "grid-cols-2"
                : "grid-cols-3"
            }`}
            style={{ width: "100%" }}
          >
            {imageFiles.map((file, idx) => {
              const url = URL.createObjectURL(file);
              return (
                <div
                  key={idx}
                  className="relative group rounded overflow-hidden border border-green-200 bg-white shadow-sm flex items-center justify-center aspect-[4/3] min-h-[120px] max-h-72"
                  style={{ width: "100%", height: "100%" }}
                >
                  <img
                    src={url}
                    alt={file.name}
                    className="object-contain w-full h-full"
                    onLoad={() => URL.revokeObjectURL(url)}
                  />
                  {/* Pasted badge */}
                  <span className="absolute top-1 left-1 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow font-semibold uppercase tracking-wider opacity-90 pointer-events-none select-none">
                    Pasted
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setFiles(
                        files.filter((_, i) => files.indexOf(file) !== i)
                      )
                    }
                    className="absolute top-1 right-1 p-1 bg-black bg-opacity-60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove image"
                  >
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Videos */}
        {videoFiles.length > 0 && (
          <div
            className={`grid gap-2 ${
              videoFiles.length === 1
                ? "grid-cols-1"
                : videoFiles.length === 2
                ? "grid-cols-2"
                : "grid-cols-3"
            } max-h-40 overflow-y-auto p-1`}
          >
            {videoFiles.map((file, idx) => {
              const url = URL.createObjectURL(file);
              return (
                <div
                  key={idx}
                  className="relative group rounded overflow-hidden"
                >
                  <video
                    src={url}
                    className="w-full h-24 object-cover"
                    onLoadedData={() => URL.revokeObjectURL(url)}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black bg-opacity-30 rounded-full p-1">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setFiles(
                        files.filter((_, i) => files.indexOf(file) !== i)
                      )
                    }
                    className="absolute top-1 right-1 p-1 bg-black bg-opacity-60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Other files */}
        {otherFiles.length > 0 && (
          <div className="flex flex-col gap-1 max-h-40 overflow-y-auto p-1">
            {otherFiles.map((file, idx) => {
              // Get file extension
              const extension = file.name.split(".").pop()?.toUpperCase();
              return (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200 group"
                >
                  <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gray-100 rounded">
                    <span className="font-medium text-xs text-gray-700">
                      {extension}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium truncate"
                      title={file.name}
                    >
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {Math.round(file.size / 1024)} KB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setFiles(
                        files.filter((_, i) => files.indexOf(file) !== i)
                      )
                    }
                    className="p-1 text-red-500 hover:text-red-700"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Render chat bubbles with WhatsApp-like styling
  const renderMessages = () => (
    <div className="flex flex-col gap-3 px-4 py-6 overflow-y-auto">
      {messages.map((msg) => {
        // Updated to handle new message structure from WebSocket API
        const isMine =
          msg.senderModel === "Client" && msg.sender?._id === user?.id;
        return (
          <div
            key={msg._id}
            className={`flex ${isMine ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`relative max-w-xs lg:max-w-md px-4 py-3 rounded-lg shadow-sm ${
                isMine
                  ? "bg-green-500 text-white"
                  : "bg-white text-gray-900 border border-gray-200"
              }`}
              style={{
                borderTopRightRadius: isMine ? "0.75rem" : "1rem",
                borderTopLeftRadius: !isMine ? "0.75rem" : "1rem",
                borderBottomRightRadius: isMine ? "0" : "1rem",
                borderBottomLeftRadius: !isMine ? "0" : "1rem",
              }}
            >
              {/* Sender Name */}
              {!isMine && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-green-700">
                    {msg.sender?.name || "Support Team"}
                  </span>
                </div>
              )}
              {/* Message Content */}
              {msg.message && (
                <div
                  className={`text-sm leading-relaxed ${
                    isMine ? "text-white" : "text-gray-800"
                  }`}
                >
                  {msg.message}
                </div>
              )}
              {/* Attachments */}
              {renderAttachments(msg.attachments)}
              {/* Timestamp and Status */}
              <div
                className={`flex items-center gap-1 text-xs mt-1 justify-end ${
                  isMine ? "text-green-100" : "text-gray-500"
                }`}
              >
                {formatTime(msg.createdAt)}
                {isMine && (
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M18 7l-8 8-4-4-1.5 1.5L9 17l9.5-9.5z" />
                  </svg>
                )}
              </div>
            </div>
          </div>
        );
      })}
      {/* {renderTypingIndicator()} */}
      <div ref={chatEndRef} />
    </div>
  );

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Don't render if we don't have user or token
  if (!user || !token) {
    return (
      <div className="flex flex-col h-full border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <svg
              className="h-12 w-12 text-gray-400 mb-3 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <p className="text-sm font-medium">Authentication required</p>
            <p className="text-xs text-gray-400">Please log in to use chat</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
      {/* Chat Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <svg
                className="h-5 w-5 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Chat</h3>
              <p className="text-sm text-gray-600">Get instant support</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 min-h-[300px] max-h-[500px] overflow-y-auto relative bg-gray-50">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="relative">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-100"></div>
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-500 border-t-transparent absolute top-0"></div>
            </div>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <div className="inline-flex items-center px-4 py-2 bg-red-50 text-red-700 rounded-lg border border-red-200">
              <svg
                className="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {error}
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-500">
            <svg
              className="h-12 w-12 text-gray-400 mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p className="text-sm font-medium">No messages yet</p>
            <p className="text-xs text-gray-400">Start a conversation!</p>
          </div>
        ) : (
          renderMessages()
        )}
      </div>

      {/* Media Gallery Modal - rendered via portal */}
      {renderGallery()}

      {/* Chat Input */}
      <div className="border-t border-gray-200 bg-white">
        <form
          onSubmit={sendMessage}
          className="flex flex-col gap-2 p-4"
          encType="multipart/form-data"
        >
          {/* Real-time file previews */}
          {renderFilePreviews()}

          {/* Error message */}
          {error && (
            <div className="px-3 py-2 text-sm text-red-700 bg-red-50 rounded-md border border-red-200 mb-2">
              {error}
              <button
                className="float-right font-bold"
                onClick={() => setError("")}
                type="button"
              >
                &times;
              </button>
            </div>
          )}

          <div className="flex items-end gap-3 w-full">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder="Type your message..."
                className="w-full px-4 py-3 border border-gray-300 rounded-3xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm placeholder-gray-500 pr-12"
                disabled={sending}
              />
              {sending && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-500 border-t-transparent"></div>
                </div>
              )}
            </div>

            {/* File input with styled button - WhatsApp style */}
            <label className="flex items-center cursor-pointer group">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
                disabled={sending}
              />
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white hover:bg-green-600 transition-all shadow">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                  />
                </svg>
              </div>
            </label>

            {/* Send Button - WhatsApp style */}
            <button
              type="submit"
              disabled={sending || (!input.trim() && files.length === 0)}
              className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white hover:bg-green-600 transition-all shadow disabled:opacity-50 disabled:bg-gray-300"
            >
              {sending ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TicketChat;
