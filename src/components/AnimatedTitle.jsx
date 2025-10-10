import gsap from "gsap";
import React, { useEffect, useRef } from "react";

const AnimatedTitle = ({ title, containerClass }) => {
  const containerRef = useRef(null);
  // Use GSAP to create an animation context for the title
  // This will animate the title when it comes into view on scroll
  useEffect(() => {
    const ctx = gsap.context(() => {
      const titleAnimation = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "100px bottom",
          end: "center bottom",
          // This will pin the title in place while it animates
          toggleActions: "play none none reverse",
        },
      });
      // Animate the title by changing its opacity and transform properties
      titleAnimation.to(".animated-word", {
        opacity: 1,
        transform: "translate3d(0, 0, 0) rotateY(0deg) rotateX(0deg)",
        ease: "power1.inOut",
        stagger: 0.05,
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    // Render the title with line breaks and animated words
    <div ref={containerRef} className={`animated-title ${containerClass}`}>
      {title.split("<br/>").map((line, index) => (
        <div
          key={index}
          className="flex-center max-w-full flex-wrap gap-2 px-10 md:gap-3"
        >
          {line.split(" ").map((word, i) => (
            <span
              key={i}
              className="animated-word"
              dangerouslySetInnerHTML={{ __html: word }}
            />
          ))}
        </div> //Split each line into words and wrap them in a span with animation
      ))}
    </div>
  );
};

export default AnimatedTitle;
