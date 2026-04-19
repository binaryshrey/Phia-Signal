"use client";

import Link from "next/link";
import { Bodoni_Moda } from "next/font/google";
import { RiArrowRightLine, RiArrowRightSLine } from "@remixicon/react";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

const IMAGES = [
  {
    src: "/four.png",
    from: { x: -200, y: -160, rotation: -15 },
    to: { x: 130, y: 80, rotation: -3 },
    pos: "top-[6%] left-[5%]",
  },
  {
    src: "/three.png",
    from: { x: 200, y: -160, rotation: 15 },
    to: { x: -130, y: 80, rotation: 3 },
    pos: "top-[6%] right-[5%]",
  },
  {
    src: "/two.png",
    from: { x: -200, y: 160, rotation: 15 },
    to: { x: 130, y: -80, rotation: 3 },
    pos: "bottom-[6%] left-[5%]",
  },
  {
    src: "/one.png",
    from: { x: 200, y: 160, rotation: -15 },
    to: { x: -130, y: -80, rotation: -3 },
    pos: "bottom-[6%] right-[5%]",
  },
];

export default function Home() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const imgRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      imgRefs.current.forEach((el, i) => {
        if (!el) return;
        const { x, y, rotation } = IMAGES[i].from;
        const to = IMAGES[i].to;

        gsap.set(el, { x, y, rotation, opacity: 0, scale: 0.6 });

        gsap.to(el, {
          x: to.x,
          y: to.y,
          rotation: to.rotation,
          opacity: 1,
          scale: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: wrapperRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 0.8,
          },
        });
      });
    }, wrapperRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={wrapperRef} className="relative h-[140vh] bg-[#141210]">
      <div className="sticky top-0 h-screen overflow-hidden text-white">
        {/* Radial glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_45%,rgba(139,105,20,0.08),transparent_70%)]" />

        {/* 4 converging images */}
        {IMAGES.map((img, i) => (
          <div
            key={img.src}
            ref={(el) => {
              imgRefs.current[i] = el;
            }}
            className={cn(
              "absolute z-0 w-[clamp(180px,22vw,320px)] rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-white/10",
              img.pos,
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.src} alt="" className="w-full h-auto" />
          </div>
        ))}

        {/* Center content */}
        <div className="relative z-10 flex h-full flex-col items-center justify-center">
          {/* Badge */}
          <div className="relative mb-24">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/yoga.svg"
              alt=""
              className="absolute -left-26 -top-28 h-[5em] opacity-80"
            />
            <div
              className={cn(
                "group rounded-full border border-white/5 bg-neutral-900 text-base text-white transition-all ease-in hover:cursor-pointer hover:bg-neutral-800",
              )}
            >
              <AnimatedShinyText className="inline-flex items-center justify-center px-4 py-1 text-neutral-400">
                <span>
                  ✨ Introducing{" "}
                  <span className="bg-gradient-to-r from-[#C9A84C] via-[#F5E6B8] to-[#C9A84C] bg-clip-text text-transparent font-semibold">
                    Ph
                  </span>
                  <span className="bg-gradient-to-r from-[#C9A84C] via-[#F5E6B8] to-[#C9A84C] bg-clip-text text-transparent font-semibold">
                    ia
                  </span>{" "}
                  <span className="bg-gradient-to-r from-[#C9A84C] via-[#F5E6B8] to-[#C9A84C] bg-clip-text text-transparent font-semibold">
                    Signal
                  </span>
                </span>
                <RiArrowRightSLine className="ml-1 size-3 translate-x-0.5" />
              </AnimatedShinyText>
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-center max-w-[1100px] px-6">
            <span
              className={`${bodoni.className} block text-[clamp(2rem,4.5vw,4.2rem)] font-bold leading-[1] tracking-[-0.02em] text-[#F5F0E8]`}
            >
              <span className="inline-block rounded-lg bg-[#C9A84C]/20 px-2 py-0.5 text-[#F5F0E8]">
                Ph
              </span>
              ilosophy of discovering your{" "}
              <img
                src="/Rectangle1.svg"
                alt=""
                className="inline-block relative -top-6 ml-1 h-[1.2em]"
              />
            </span>
            <span
              className={`${bodoni.className} block text-[clamp(2rem,4.5vw,4.2rem)] font-bold italic leading-[1] tracking-[-0.02em] text-[#C9A84C]`}
            >
              signature style as insign
              <span className="inline-block rounded-lg bg-[#C9A84C]/20 px-2 py-0.5 text-[#C9A84C]">
                ia
              </span>
              .
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-10 max-w-[640px] text-center text-[clamp(0.9rem,1.8vw,1.15rem)] leading-relaxed text-white/40 px-6">
            Your personal AI stylist that learns your body, skin tone, and taste
            — then curates, fits, and styles every piece to match who you are.
          </p>

          {/* CTA with floating SVGs */}
          <div className="relative mt-12">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/k_pop_guru.svg"
              alt=""
              className="absolute -left-48 top-4 h-[5em] opacity-80"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/Rectangle.svg"
              alt=""
              className="absolute -right-48 top-20 h-[5em] opacity-80"
            />

            <Link
              href="/onboarding"
              className="group relative flex items-center gap-0 rounded-full bg-[#F5F0E8] pl-7 pr-1.5 py-1.5 text-[15px] font-semibold text-[#141210] shadow-[0_8px_32px_rgba(139,105,20,0.15)] transition-all hover:shadow-[0_12px_40px_rgba(139,105,20,0.25)]"
            >
              <span className="pr-4">Get started</span>
              <span className="flex size-10 items-center justify-center rounded-full bg-[#141210] text-[#F5F0E8] transition-transform group-hover:translate-x-0.5">
                <RiArrowRightLine className="size-4" />
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
