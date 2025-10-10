import React from "react";
import "../index.css";

const GameCard = ({ src, title, description }) => {
  // Helper to check if src is a gif
  const isGif = src.toLowerCase().endsWith(".gif");

  return (
    // This component renders a game card with a video or gif background
    // It displays the title and description over the video or gif
    <div className="relative size-full">
      {isGif ? (
        <img
          src={src}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
      ) : (
        // If the src is not a gif, render a video
        <video
          src={src}
          loop
          muted
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
      )}
      <div className="relative z-10 flex size-full flex-col justify-between p-5 text-blue-50">
        <div>
          <h1 className="card-title font-Valorax">{title}</h1>
          {description && (
            <p className="mt-3 max-w-64 text-xs md:text-base font-circularweb">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameCard;
