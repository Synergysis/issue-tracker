import React, { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

const MediaGallery = ({
  showGallery,
  setShowGallery,
  galleryItems,
  galleryIndex,
  setGalleryIndex,
  getAssetUrl,
  zoomLevel,
  setZoomLevel,
  isDragging,
  setIsDragging,
  dragOffset,
  setDragOffset,
  dragStart,
  setDragStart,
  imageLoading,
  setImageLoading,
}) => {
  // Zoom handling functions
  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  }, [setZoomLevel]);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 1));
  }, [setZoomLevel]);

  const handleResetZoom = useCallback(() => {
    setZoomLevel(1);
    setDragOffset({ x: 0, y: 0 });
  }, [setZoomLevel, setDragOffset]);

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

  // Reset zoom when changing images and handle body scroll
  useEffect(() => {
    if (showGallery) {
      handleResetZoom();
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }

    return () => {
      if (showGallery) {
        document.body.style.overflow = "";
        document.body.style.paddingRight = "";
      }
    };
  }, [showGallery, handleResetZoom]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!showGallery) return;

      switch (e.key) {
        case "ArrowLeft":
          if (galleryIndex > 0) {
            setGalleryIndex(galleryIndex - 1);
          }
          break;
        case "ArrowRight":
          if (galleryIndex < galleryItems.length - 1) {
            setGalleryIndex(galleryIndex + 1);
          }
          break;
        case "Escape":
          setShowGallery(false);
          break;
        case "+":
        case "=":
          e.preventDefault();
          handleZoomIn();
          break;
        case "-":
          e.preventDefault();
          handleZoomOut();
          break;
        case "0":
          e.preventDefault();
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
  }, [
    showGallery,
    galleryItems.length,
    galleryIndex,
    setGalleryIndex,
    setShowGallery,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
  ]);

  if (!showGallery || galleryItems.length === 0) return null;

  const currentItem = galleryItems[galleryIndex];
  const isImage = currentItem.mimetype?.startsWith("image/");
  const url = getAssetUrl(currentItem);
  const fileName =
    currentItem.originalname || currentItem.filename || "File attachment";

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] bg-black bg-opacity-90 flex flex-col justify-center items-center"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black to-transparent z-10">
        <div className="text-white flex items-center space-x-3">
          <h3 className="text-lg font-medium truncate max-w-[200px] sm:max-w-[300px] md:max-w-none">
            {fileName}
          </h3>
        </div>

        <div className="flex items-center gap-3">
          {/* Zoom Controls - Only for images */}
          {isImage && (
            <div className="flex items-center gap-1 mr-2">
              <button
                onClick={handleZoomOut}
                disabled={zoomLevel <= 1}
                className={`p-2 rounded-full transition-all ${
                  zoomLevel <= 1
                    ? "bg-gray-700 text-gray-500"
                    : "bg-gray-800 hover:bg-gray-700 text-white"
                }`}
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
                    d="M20 12H4"
                  />
                </svg>
              </button>
              <button
                onClick={handleResetZoom}
                className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-white transition-all"
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
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
              <button
                onClick={handleZoomIn}
                disabled={zoomLevel >= 3}
                className={`p-2 rounded-full transition-all ${
                  zoomLevel >= 3
                    ? "bg-gray-700 text-gray-500"
                    : "bg-gray-800 hover:bg-gray-700 text-white"
                }`}
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
            className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-white transition-all"
            onClick={(e) => e.stopPropagation()}
          >
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
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </a>

          {/* Close Button */}
          <button
            onClick={() => setShowGallery(false)}
            className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-white transition-all"
          >
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center w-full p-4 relative">
        {/* Navigation Buttons */}
        {galleryItems.length > 1 && (
          <>
            <button
              onClick={() => {
                setGalleryIndex((prev) =>
                  prev === 0 ? galleryItems.length - 1 : prev - 1
                );
              }}
              className="absolute left-4 p-3 rounded-full bg-black bg-opacity-60 hover:bg-opacity-80 text-white transition-all z-10"
            >
              <svg
                className="w-6 h-6"
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

            <button
              onClick={() => {
                setGalleryIndex((prev) =>
                  prev === galleryItems.length - 1 ? 0 : prev + 1
                );
              }}
              className="absolute right-4 p-3 rounded-full bg-black bg-opacity-60 hover:bg-opacity-80 text-white transition-all z-10"
            >
              <svg
                className="w-6 h-6"
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
          </>
        )}

        {/* Media Container */}
        <div className="relative max-w-full max-h-full flex items-center justify-center rounded-lg overflow-hidden">
          {isImage ? (
            <div
              className="relative bg-black bg-opacity-40 rounded-lg overflow-hidden"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              style={{
                cursor:
                  zoomLevel > 1
                    ? isDragging
                      ? "grabbing"
                      : "grab"
                    : "default",
              }}
            >
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 z-10">
                  <div className="flex flex-col items-center">
                    <div className="animate-spin h-10 w-10 border-4 border-white border-t-transparent rounded-full mb-2"></div>
                    <p className="text-white text-sm">Loading image...</p>
                  </div>
                </div>
              )}
              <img
                src={url}
                alt={fileName}
                className="max-h-[75vh] max-w-[95vw] md:max-w-[90vw] object-contain"
                style={{
                  transform: `scale(${zoomLevel}) translate(${dragOffset.x}px, ${dragOffset.y}px)`,
                  transition: isDragging ? "none" : "transform 0.3s ease",
                  touchAction: zoomLevel > 1 ? "none" : "auto",
                }}
                onLoad={() => setImageLoading(false)}
              />
              {zoomLevel > 1 && (
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
                  {Math.round(zoomLevel * 100)}%
                </div>
              )}
            </div>
          ) : currentItem.mimetype?.startsWith("video/") ? (
            <video
              src={url}
              controls
              playsInline
              autoPlay
              className="max-h-[75vh] max-w-[95vw] md:max-w-[90vw]"
            />
          ) : (
            <div className="flex flex-col items-center justify-center bg-gray-800 p-8 rounded-lg">
              <div className="text-7xl mb-4">📄</div>
              <p className="text-white text-xl mb-2">{fileName}</p>
              <a
                href={url}
                download={fileName}
                className="mt-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                Download File
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Bar with Pagination */}
      {galleryItems.length > 1 && (
        <div className="w-full px-4 py-3 bg-gradient-to-t from-black to-transparent">
          <div className="flex justify-center">
            <div className="text-white text-sm font-medium">
              {galleryIndex + 1} of {galleryItems.length}
            </div>
          </div>
        </div>
      )}

      {/* Background click handler */}
      <div
        className="absolute inset-0 z-[-1]"
        onClick={() => setShowGallery(false)}
      />
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default MediaGallery;
