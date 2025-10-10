import React, { useEffect, useRef, useState } from "react";
import "../index.css";
import Button from "./Button";
import { TiLocationArrow } from "react-icons/ti";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/all";
gsap.registerPlugin(ScrollTrigger);

const Hero = () => {
  const [CurrentIndex, setCurrentIndex] = useState(1);
  const [hasClicked, sethasClicked] = useState(false);
  const [isLoading, setisLoading] = useState(true);
  const [loadedVideos, setloadedVideos] = useState(0);

  const totalVideos = 4;
  const nextVideoRef = useRef(null);

  const handleMiniVdClick = () => {
    sethasClicked(true);
    setCurrentIndex(upcomingVideoIndex);
  };

  const getVideoSrc = (index) => `videos/hero_asset-${index}.mp4`;

  const handleVideoLoad = () => {
    setloadedVideos((prev) => prev + 1);
  };

  // Calculate the index of the next video based on the current index
  const upcomingVideoIndex = (CurrentIndex % totalVideos) + 1;

  // Calculate the index of the previous video based on the current index
  useEffect(() => {
    if (loadedVideos === totalVideos - 1) {
      setisLoading(false);
    }
  }, [loadedVideos]);

  useGSAP(
    // This effect handles the transition between videos when the mini video is clicked
    () => {
      if (hasClicked) {
        gsap.set("#next-video", { visibility: "visible" });
        gsap.to("#next-video", {
          transformOrigin: "center center",
          scale: 1,
          width: "100%",
          height: "100%",
          duration: 1,
          ease: "power1.inOut",
          onStart: () => nextVideoRef.current.play(),
        });
        // This will animate the current video to scale down and fade out
        gsap.from("#current-video", {
          transformOrigin: "center center",
          scale: 0,
          duration: 1.5,
          ease: "power1.inOut",
        });
      }
    },
    // This effect runs when the component mounts and when hasClicked changes
    {
      dependencies: [CurrentIndex],
      revertOnUpdate: true,
    }
  );

  useGSAP(() => {
    // Set the initial clip path and border radius for the video frame
    gsap.set("#video-frame", {
      clipPath: "polygon(14% 0, 72% 0, 88% 90%, 0 95%)",
      borderRadius: "0% 0% 50% 15%",
    });
    // Animate the video frame to reveal the video content
    // This will create a smooth transition effect when the page loads
    gsap.from("#video-frame", {
      clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
      borderRadius: "0% 0% 0% 0%",
      ease: "power1.inOut",
      scrollTrigger: {
        trigger: "#video-frame",
        start: "center center",
        end: "bottom center",
        scrub: true,
      },
    });
  });

  return (
    // This conditionally renders a loading spinner if the videos are still loading
    // It uses a three-body loading animation to indicate that the content is being prepared
    <div className="relative h-dvh w-screen overflow-x-hidden" id="home">
      {isLoading && (
        <div className="flex-center absolute z-[100] h-dvh w-screen overflow-hidden bg-violet-50">
          <div className="three-body">
            <div className="three-body__dot" />
            <div className="three-body__dot" />
            <div className="three-body__dot" />
          </div>
        </div>
      )}
      <div
        id="video-frame"
        className="relative z-10 h-dvh w-screen overflow-hidden rounded-lg bg-blue-75"
      >
        <div>
          <div className="mask-clip-path absolute-center absolute z-50 size-64 cursor-pointer overflow-hidden rounded-lg">
            <div
              onClick={handleMiniVdClick}
              // This video is the current one playing
              // It will be replaced by the next video when the user clicks on the mini video
              className="origin-center scale-50 opacity-0 transition-all duration-500 ease-in hover:scale-100 hover:opacity-100"
            >
              <video
                ref={nextVideoRef}
                src={getVideoSrc(upcomingVideoIndex)}
                loop
                muted
                id="current-video"
                className="size-64 origin-center scale-150 object-cover object-center"
                onLoadedData={handleVideoLoad}
                playsInline
                autoPlay
                preload="auto"
                style={{ imageRendering: 'crisp-edges' }}
              />
            </div>
          </div>
          <video
            ref={nextVideoRef}
            // This video is the next one to play
            // It will be played when the user clicks on the mini video
            src={getVideoSrc(CurrentIndex)}
            loop
            muted
            id="next-video"
            className="absolute-center invisible absolute z-20 size-64 object-cover object-center"
            onLoadedData={handleVideoLoad}
            // This video will be played when the user clicks on the mini video
            playsInline
            autoPlay
            preload="auto"
            style={{ imageRendering: 'crisp-edges' }}
          />
          <video
            // This video is the current one playing
            // It will be replaced by the next video when the user clicks on the mini video
            src={getVideoSrc(
              // If the current index is the last video, play the first video
              CurrentIndex === totalVideos - 1 ? 1 : CurrentIndex
            )}
            autoPlay
            loop
            muted
            className="absolute left-0 top-0 size-full object-cover object-center"
            onLoadedData={handleVideoLoad}
            playsInline
            preload="auto"
            style={{ imageRendering: 'crisp-edges' }}
          />
        </div>
        <h1 className="header-font hero-heading absolute bottom-20 md:bottom-5 right-10 z-40 text-blue-75">
          Reimagi<b>n</b>ed
        </h1>
        <div className="absolute left-10 top-0 z-40 size-full">
          <div className="mt-24 px-5 sm:px-10">
            <h1 className="hero-heading header-font text-blue-100">
              B<b>e</b>tting
            </h1>
            <p className="mb-5 max-w-64 font-VeniteAdoremus-straight text-blue-100">
              A New Realm Calls. Will You Cross the Threshold?
            </p>
            <Button
              id="watch-trailer"
              title="Launch dapp"
              leftIcon={<TiLocationArrow />}
              containerClass="!bg-yellow-300 flex-center gap-1"
            />
          </div>
        </div>
      </div>
      <h1 className="font-VeniteAdoremus-regular hero-heading absolute bottom-20 md:bottom-5 right-10  text-black">
        Reimagined
      </h1>
    </div>
  );
};

export default Hero;
