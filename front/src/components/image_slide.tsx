"use client";

import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";
import { useEffect, useRef } from "react";

interface ImageCarouselProps {
  images: string[];
}

export default function ImageCarousel({ images }: ImageCarouselProps) {
  const timer = useRef<NodeJS.Timeout | null>(null);
  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({
    loop: true,
    slides: {
      perView: 1,
    },
  });

  useEffect(() => {
    if (!instanceRef.current) return;

    timer.current = setInterval(() => {
      instanceRef.current?.next();
    }, 3000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [instanceRef]);

  return (
    <div
      ref={sliderRef}
      className="keen-slider rounded-lg overflow-hidden w-full"
    >
      {images.map((img, index) => (
        <div key={index} className="keen-slider__slide">
          <img
            src={img}
            alt={`Recipe image ${index}`}
            className="w-full h-120 object-cover"
          />
        </div>
      ))}
    </div>
  );
}
