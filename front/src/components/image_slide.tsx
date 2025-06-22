"use client";

import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";
import { useEffect, useRef } from "react";
import Image from "next/image";

interface Recipe {
  img: string;
  name: string;
  autor: string;
  igredients: string;
  category: string;
}

interface ImageCarouselProps {
  recipes: Recipe[];
}

export default function ImageCarousel({ recipes }: ImageCarouselProps) {
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
    }, 5000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [instanceRef]);

  return (
    <div
      ref={sliderRef}
      className="keen-slider rounded-lg overflow-hidden w-full"
    >
      {recipes.map((recipe, index) => (
        <div
          key={index}
          className="keen-slider__slide flex gap-6 items-center p-6"
        >
          <div className="relative w-[400px] h-[400px] shrink-0">
            <Image
              src={recipe.img}
              alt={`Imagem da receita ${index}`}
              fill
              className="object-contain rounded-md"
              sizes="(max-width: 768px) 100vw, 400px"
            />
          </div>
          <div className="flex-1 text-gray-800 dark:text-gray-200">
            <h2 className="text-2xl font-bold mb-2">{recipe.name}</h2>

            {recipe.autor && (
              <p className="text-sm">
                <span className="font-semibold">Autor:</span> {recipe.autor}
              </p>
            )}

            {recipe.category && (
              <p className="text-sm mb-1">
                <span className="font-semibold">Categoria:</span>{" "}
                {recipe.category}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
