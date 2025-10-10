import React, { useEffect, useRef, useState } from "react";
import Button from "./Button";
import { TiLocationArrow } from "react-icons/ti";
import "../index.css";
import { useWindowScroll } from "react-use";
import gsap from "gsap";
import { TbMusicPause } from "react-icons/tb";

const navItems = ["Home", "About", "Roadmap",];

const Navbar = () => {
  // Safely check screen size (avoids SSR issues)
  const [ismdScreen, setIsmdScreen] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsmdScreen(window.innerWidth >= 768);
    }
  }, []);

  const navContainerRef = useRef(null);
  const audioElementRef = useRef(null);

  // State to manage audio playback and indicator animation
  // isAudioPlaying: tracks whether the audio is currently playing
  const [isAudioPlaying, setisAudioPlaying] = useState(false);
  const [isIndicatorActive, setisIndicatorActive] = useState(false);

  // Function to toggle audio playback and indicator animation
  // When the button is clicked, it toggles the audio playback state
  const toggleAudioIndicator = () => {
    setisAudioPlaying((prev) => !prev);
    setisIndicatorActive((prev) => !prev);
  };

  // Effect to handle audio playback based on isAudioPlaying state
  // If isAudioPlaying is true, the audio element plays; otherwise, it pauses
  useEffect(() => {
    if (isAudioPlaying) {
      audioElementRef.current
        ?.play()
        .catch((err) => console.warn("Autoplay blocked:", err));
    } else {
      audioElementRef.current?.pause();
    }
  }, [isAudioPlaying]);

  const { y: currentScrollY } = useWindowScroll();
  const lastScrollY = useRef(0); // useRef instead of state to prevent extra renders
  const [isNavVisible, setisNavVisible] = useState(true);

  // Effect to handle navigation visibility based on scroll position
  // If the user scrolls to the top, the navigation is visible
  useEffect(() => {
    if (!navContainerRef.current) return;

    if (currentScrollY === 0) {
      setisNavVisible(true);
      navContainerRef.current.classList.remove("floating-nav");
    } else if (currentScrollY > lastScrollY.current) {
      setisNavVisible(false);
      navContainerRef.current.classList.add("floating-nav");
    } else if (currentScrollY < lastScrollY.current && ismdScreen) {
      setisNavVisible(true);
      navContainerRef.current.classList.add("floating-nav");
    }

    lastScrollY.current = currentScrollY;
  }, [currentScrollY, ismdScreen]);

  // Effect to animate the navigation container based on isNavVisible state
  // If isNavVisible is true, the navigation slides down; otherwise, it slides up
  useEffect(() => {
    if (!navContainerRef.current) return;
    gsap.to(navContainerRef.current, {
      y: isNavVisible ? 0 : -100,
      opacity: isNavVisible ? 1 : 0,
      duration: 0.2,
    });
  }, [isNavVisible]);

  return (
    <div
      ref={navContainerRef}
      className="fixed inset-x-0 top-4 z-50 h-16 border-none transition-all duration-700 sm:inset-x-6"
    >
      <header className="absolute top-1/2 w-full -translate-y-1/2 ">
        <nav className="flex size-full items-center justify-between p-4 ">
          <div className="flex items-center gap-7">
            <img src="/img/logo_1.png" alt="logo" className="w-10" />

            <Button
              id="product-button"
              title="Explore"
              rightIcon={<TiLocationArrow />}
              containerClass="bg-blue-50 md:flex hidden items-center justify-center gap-1"
            />
          </div>

          <div className="flex h-full items-center">
            <div className="hidden md:block ">
              {navItems.map((item, index) => (
                <a
                  key={index}
                  className="nav-hover-btn"
                  href={`#${item.toLowerCase()}`}
                >
                  {item}
                </a>
              ))}
            </div>

            <button
              className="ml-10 flex items-center space-x-0.5"
              onClick={toggleAudioIndicator}
            >
              <audio
                ref={audioElementRef}
                className="hidden"
                src="/audio/loop_1.mp3"
                loop
              />
              {isAudioPlaying ? (
                // Render the audio indicator with animation
                [1, 2, 3, 4].map((bar) => (
                  <div
                    key={bar}
                    className={`cursor-pointer indicator-line ${
                      isIndicatorActive ? "active" : ""
                    }`}
                    style={{ animationDelay: `${bar * 0.1}s` }}
                  />
                ))
              ) : (
                // Render the pause icon when audio is not playing
                <TbMusicPause
                  color="white"
                  size={18}
                  className="cursor-pointer"
                />
              )}
            </button>
          </div>
        </nav>
      </header>
    </div>
  );
};

export default Navbar;
