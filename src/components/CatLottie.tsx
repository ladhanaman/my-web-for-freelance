"use client";

import { DotLottieReact } from '@lottiefiles/dotlottie-react';

export default function CatLottie() {
  return (
    <div className="w-full max-w-xs aspect-square flex items-center justify-center mb-0 anim-fade-up">
      <DotLottieReact
        src="/maroon-cat-meow.lottie"
        loop
        autoplay
      />
    </div>
  );
}
