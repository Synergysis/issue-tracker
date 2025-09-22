import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaExclamationTriangle,
  FaSyncAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaClipboard,
  FaArrowLeft,
  FaDownload,
  FaFileAlt,
} from "react-icons/fa";
import api from "../../api/apiService";
import TicketChat from "../../components/TicketChat";
import "../../assets/galleryAnimations.css";
import "../../assets/galleryResponsive.css";
import "../../assets/galleryAccessibility.css";

const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  try {
    return new Date(dateStr).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
};

const getStatusConfig = (status) => {
  switch (status?.toLowerCase()) {
    case "open":
      return {
        color: "bg-red-100 text-red-800 border-red-200",
        icon: <FaExclamationTriangle className="inline align-middle" />,
      };
    case "in-progress":
    case "in_progress":
      return {
        color: "bg-amber-100 text-amber-800 border-amber-200",
        icon: <FaSyncAlt className="inline align-middle" />,
      };
    case "resolved":
      return {
        color: "bg-green-100 text-green-800 border-green-200",
        icon: <FaCheckCircle className="inline align-middle" />,
      };
    case "cancelled":
      return {
        color: "bg-gray-100 text-gray-800 border-gray-200",
        icon: <FaTimesCircle className="inline align-middle" />,
      };
    default:
      return {
        color: "bg-gray-100 text-gray-800 border-gray-200",
        icon: <FaClipboard className="inline align-middle" />,
      };
  }
};

const getPriorityConfig = (priority) => {
  switch (priority?.toLowerCase()) {
    case "urgent":
      return {
        color: "bg-red-100 text-red-800 border-red-200",
        icon: <FaExclamationTriangle className="inline align-middle" />,
      };
    case "high":
      return {
        color: "bg-orange-100 text-orange-800 border-orange-200",
        icon: <FaArrowLeft className="inline align-middle rotate-45" />,
      };
    case "medium":
      return {
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: <FaArrowLeft className="inline align-middle" />,
      };
    case "low":
      return {
        color: "bg-green-100 text-green-800 border-green-200",
        icon: <FaArrowLeft className="inline align-middle -rotate-45" />,
      };
    default:
      return {
        color: "bg-gray-100 text-gray-800 border-gray-200",
        icon: <FaArrowLeft className="inline align-middle" />,
      };
  }
};

const SuperAdminTicketDetailPage = () => {
  const { ticket_id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Gallery state for attachments
  const [showGallery, setShowGallery] = useState(false);
  const [galleryItems, setGalleryItems] = useState([]);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [imageLoading, setImageLoading] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    if (ticket_id) {
      fetchTicket();
    } else {
      setError("No ticket ID provided");
      setLoading(false);
    }
    // eslint-disable-next-line
  }, [ticket_id]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get(`/superadmin/tickets/${ticket_id}`);
      const ticketData = response.data.data || response.data;
      setTicket(ticketData);
    } catch (err) {
      let message = "Failed to load ticket.";
      if (err.response?.data?.message) {
        message = err.response.data.message;
      } else if (err.response?.status === 404) {
        message = "Ticket not found.";
      } else if (err.response?.status === 401) {
        message = "You are not authorized to view this ticket.";
      } else if (err.response?.status === 500) {
        message = "Server error. Please try again later.";
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const openImagePreview = (imageSrc) => {
    // Store current scroll position
    setScrollPosition(window.pageYOffset || document.documentElement.scrollTop);

    // Find the current image in the ticket files
    const fileIndex = ticket.files.findIndex((file) => {
      const fileSrc = `${
        import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"
      }/${file.path.replace(/\\/g, "/")}`;
      return fileSrc === imageSrc;
    });

    // Open gallery with all files, starting from the clicked image
    setGalleryItems(ticket.files || []);
    setGalleryIndex(fileIndex >= 0 ? fileIndex : 0);
    setShowGallery(true);
  };

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    if (!ticket) return;
    setUpdatingStatus(true);
    try {
      const response = await api.put(
        `/superadmin/tickets/${ticket.id || ticket._id}`,
        { status: newStatus }
      );
      if (response.data.success) {
        await fetchTicket();
        alert("Ticket status updated successfully!");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Error updating ticket status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Helper function to get asset URL for gallery
  const getAssetUrl = (file) => {
    if (!file) return null;
    return `${
      import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"
    }/${file.path.replace(/\\/g, "/")}`;
  };

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
      setDragStart({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoomLevel > 1) {
      setDragOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
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

  // Reset loading state when gallery index changes
  useEffect(() => {
    if (showGallery && galleryItems.length > 0) {
      const currentItem = galleryItems[galleryIndex];
      if (currentItem?.mimetype?.startsWith("image/")) {
        setImageLoading(true);
      }
    }
  }, [galleryIndex, showGallery, galleryItems]);

  // Render the media gallery modal
  const renderGallery = () => {
    if (!showGallery || galleryItems.length === 0) return null;

    const currentItem = galleryItems[galleryIndex];
    const isImage = currentItem.mimetype?.startsWith("image/");
    const isVideo = currentItem.mimetype?.startsWith("video/");
    const url = getAssetUrl(currentItem);
    const fileName =
      currentItem.originalname || currentItem.filename || "File attachment";

    const modalContent = (
      <div
        className="gallery-modal gallery-overlay"
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
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
              onClick={() => setShowGallery(false)}
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
          {/* Previous Button */}
          {galleryItems.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setGalleryIndex((prev) =>
                  prev === 0 ? galleryItems.length - 1 : prev - 1
                );
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

          {/* Media Container */}
          <div
            className="relative max-w-full max-h-full flex items-center justify-center rounded-lg overflow-hidden gallery-image-container"
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
                {imageLoading && (
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
                  }}
                  onLoad={() => setImageLoading(false)}
                  onError={(e) => {
                    const container = e.target.parentNode;
                    e.target.style.display = "none";
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

                {/* Zoom Level Indicator */}
                {zoomLevel > 1 && (
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
                    {Math.round(zoomLevel * 100)}%
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

          {/* Next Button */}
          {galleryItems.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setGalleryIndex((prev) =>
                  prev === galleryItems.length - 1 ? 0 : prev + 1
                );
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

        {/* Background click handler to close */}
        <div
          className="absolute inset-0 z-[-1]"
          onClick={() => setShowGallery(false)}
        ></div>
      </div>
    );

    // Use portal to render modal at document.body level
    return createPortal(modalContent, document.body);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ticket details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-50 p-3 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center">
            <span className="text-red-600 text-xl">✕</span>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!ticket) return null;

  const statusConfig = getStatusConfig(ticket.status);
  const priorityConfig = getPriorityConfig(ticket.priority);

  return (
    <div className="min-h-screen ">
      <div className=" mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4 bg-white rounded-lg px-4 py-3 shadow-sm">
          <button
            onClick={() => navigate("/superadmin/tickets")}
            className="hover:text-green-700 transition-colors font-medium flex items-center gap-1"
          >
            <FaArrowLeft className="w-4 h-4" />
            Tickets
          </button>
          <span className="text-gray-400">›</span>
          <span className="text-gray-900 font-semibold">
            Ticket #{ticket.id || ticket._id}
          </span>
        </nav>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">
                    Ticket #{ticket.id || ticket._id}
                  </h1>
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}
                  >
                    <span>{statusConfig.icon}</span>
                    {ticket.status?.replace("_", " ").toUpperCase() ||
                      "UNKNOWN"}
                  </span>
                </div>
                <p className="text-lg text-gray-700">{ticket.title}</p>
                <div className="flex items-center gap-4 mt-3">
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${priorityConfig.color}`}
                  >
                    <span>{priorityConfig.icon}</span>
                    {(ticket.priority || "MEDIUM").toUpperCase()}
                  </span>
                  <span className="text-sm text-gray-500">
                    Created {formatDate(ticket.createdAt || ticket.created_at)}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="relative">
                  <select
                    className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    value={ticket.status}
                    onChange={handleStatusChange}
                    disabled={updatingStatus}
                  >
                    <option value="open">Open</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  {updatingStatus && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-500 border-t-transparent"></div>
                    </div>
                  )}
                </div>
                {/* <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium">
                  Add Comment
                </button> */}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Ticket Details */}
          <div className="lg:col-span-7 space-y-6">
            {/* Description */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="bg-green-50 px-6 py-4 border-b border-green-100">
                <h2 className="text-lg font-semibold text-gray-900">
                  Description
                </h2>
              </div>
              <div className="p-6">
                <p className="text-gray-800 whitespace-pre-wrap">
                  {ticket.description || "No description provided."}
                </p>
              </div>
            </div>

            {/* Attachments */}
            {ticket.files && ticket.files.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="bg-green-50 px-6 py-4 border-b border-green-100">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Attachments ({ticket.files.length})
                  </h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ticket.files.map((file) => {
                      const imageSrc = `${
                        import.meta.env.VITE_BACKEND_URL ||
                        "http://localhost:5000"
                      }/${file.path.replace(/\\/g, "/")}`;
                      return (
                        <div
                          key={file._id}
                          className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-all"
                        >
                          {file.mimetype &&
                          file.mimetype.startsWith("image/") ? (
                            <div className="mb-3">
                              <img
                                src={imageSrc}
                                alt={file.originalname}
                                className="w-full h-36 object-cover rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => openImagePreview(imageSrc)}
                              />
                            </div>
                          ) : (
                            <div className="h-36 bg-gray-50 rounded-md flex items-center justify-center mb-3">
                              <FaFileAlt className="text-3xl text-gray-400" />
                            </div>
                          )}
                          <h4 className="font-medium text-gray-900 mb-2 truncate">
                            {file.originalname}
                          </h4>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                              {Math.round(file.size / 1024)} KB
                            </span>
                            <a
                              href={imageSrc}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
                              download={file.originalname}
                            >
                              <FaDownload className="inline w-4 h-4 mr-1" />{" "}
                              Download
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Ticket Information & Live Chat */}
          <div className="lg:col-span-5 space-y-6">
            {/* Ticket Information */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="bg-green-50 px-6 py-4 border-b border-green-100">
                <h2 className="text-lg font-semibold text-gray-900">
                  Ticket Information
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">
                    Ticket ID
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    #{ticket.id || ticket._id}
                  </span>
                </div>{" "}
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">
                    Category
                  </span>
                  <span className="text-sm font-medium bg-blue-50 text-blue-800 px-3 py-1 rounded-full">
                    {ticket.category || "General"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">
                    Priority
                  </span>
                  <span
                    className={`text-sm font-medium px-3 py-1 rounded-full ${priorityConfig.color}`}
                  >
                    {priorityConfig.icon} {ticket.priority || "Medium"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">
                    Status
                  </span>
                  <span
                    className={`text-sm font-medium px-3 py-1 rounded-full ${statusConfig.color}`}
                  >
                    {statusConfig.icon}{" "}
                    {ticket.status?.replace("_", " ") || "Unknown"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">
                    Last Updated
                  </span>
                  <span className="text-sm text-gray-900">
                    {formatDate(
                      ticket.updatedAt ||
                        ticket.updated_at ||
                        ticket.createdAt ||
                        ticket.created_at
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-gray-600">
                    Created On
                  </span>
                  <span className="text-sm text-gray-900">
                    {formatDate(ticket.createdAt || ticket.created_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* Live Chat */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <TicketChat ticketId={ticket_id} />
            </div>
          </div>
        </div>

        {/* Gallery Modal for Attachments - rendered via portal */}
        {renderGallery()}
      </div>
    </div>
  );
};

export default SuperAdminTicketDetailPage;
