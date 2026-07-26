import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import "./styles/Cursor.css";
import gsap from "gsap";

const PARTICLE_INTERVAL_MS = 50;
const PARTICLE_MIN_DISTANCE = 4;
const PARTICLE_MIN_VIEWPORT_WIDTH = 600;

const Cursor = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({ disabled: false });
  const location = useLocation();

  // Clicking a `data-cursor="disable"` link to navigate unmounts it before the
  // browser ever fires "mouseout" on it (route change swaps the DOM instantly),
  // so the disabled state can get stuck across a client-side navigation.
  // Force a clean slate on every route change.
  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;
    cursor.classList.remove("cursor-disable");
    stateRef.current.disabled = false;
  }, [location.pathname]);

  useEffect(() => {
    const cursor = cursorRef.current!;
    const particleLayer = particlesRef.current!;
    const mousePos = { x: 0, y: 0 };
    const cursorPos = { x: 0, y: 0 };
    let lastParticle = { x: 0, y: 0, time: 0 };

    gsap.set(cursor, { rotation: 45 });

    const handleMouseMove = (e: MouseEvent) => {
      mousePos.x = e.clientX;
      mousePos.y = e.clientY;
    };
    document.addEventListener("mousemove", handleMouseMove);

    const spawnParticle = (x: number, y: number) => {
      const particle = document.createElement("div");
      particle.className = "cursor-particle";
      particleLayer.appendChild(particle);
      gsap.set(particle, { x, y });
      gsap.to(particle, {
        x: x + (Math.random() - 0.5) * 24,
        y: y + (Math.random() - 0.5) * 24,
        scale: 0,
        opacity: 0,
        duration: 0.6,
        ease: "power1.out",
        onComplete: () => particle.remove(),
      });
    };

    let rafId = requestAnimationFrame(function loop(time: number) {
      const delay = 6;
      cursorPos.x += (mousePos.x - cursorPos.x) / delay;
      cursorPos.y += (mousePos.y - cursorPos.y) / delay;
      gsap.to(cursor, { x: cursorPos.x, y: cursorPos.y, duration: 0.1 });

      if (!stateRef.current.disabled && window.innerWidth >= PARTICLE_MIN_VIEWPORT_WIDTH) {
        const dist = Math.hypot(
          cursorPos.x - lastParticle.x,
          cursorPos.y - lastParticle.y
        );
        if (
          time - lastParticle.time > PARTICLE_INTERVAL_MS &&
          dist > PARTICLE_MIN_DISTANCE
        ) {
          spawnParticle(cursorPos.x, cursorPos.y);
          lastParticle = { x: cursorPos.x, y: cursorPos.y, time };
        }
      }
      rafId = requestAnimationFrame(loop);
    });

    // Delegated on document (not queried once per element) so it keeps working
    // for pages/elements that mount after this effect runs — e.g. navigating
    // client-side from "/" to "/myworks" or "/stories".
    const handleMouseOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest<HTMLElement>("[data-cursor]");
      if (!target) return;

      if (target.dataset.cursor === "disable") {
        cursor.classList.add("cursor-disable");
        stateRef.current.disabled = true;
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest<HTMLElement>("[data-cursor]");
      if (!target) return;

      cursor.classList.remove("cursor-disable");
      stateRef.current.disabled = false;
    };

    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseout", handleMouseOut);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseout", handleMouseOut);
      cancelAnimationFrame(rafId);
      particleLayer.innerHTML = "";
    };
  }, []);

  return (
    <>
      <div className="cursor-particles" ref={particlesRef}></div>
      <div className="cursor-main" ref={cursorRef}></div>
    </>
  );
};

export default Cursor;
