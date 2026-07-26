import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./styles/DomeSheet.css";

gsap.registerPlugin(ScrollTrigger);

// A dot-grid canvas that "bulges" toward the cursor, like a ball pushed up
// beneath taut cloth. Points displace radially out from the lift centre by
// a gaussian falloff; a height field drives a near-side highlight and
// far-side shadow so the bulge reads as lit fabric. Otherwise it's just a
// whisper of texture over the landing section's background.
const GAP = 30; // grid spacing
const SIGMA = 165; // dome radius
const LIFT = 34; // peak outward displacement (px)

const DomeSheet = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (prefersReduced || !fine) return;

    const sheet = canvasRef.current!;
    const sctx = sheet.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Canvas fillStyle can't resolve CSS var() at draw time — resolve once.
    const dotRGB =
      getComputedStyle(document.documentElement).getPropertyValue("--textColorRGB").trim() ||
      "38, 33, 28";

    let iw = 0;
    let ih = 0;
    let cols = 0;
    let rows = 0;

    const sizeSheet = () => {
      iw = window.innerWidth;
      ih = window.innerHeight;
      sheet.width = Math.round(iw * dpr);
      sheet.height = Math.round(ih * dpr);
      sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(iw / GAP) + 2;
      rows = Math.ceil(ih / GAP) + 2;
    };
    sizeSheet();
    window.addEventListener("resize", sizeSheet);

    let tx = -9999;
    let ty = -9999;
    let bx = iw / 2;
    let by = ih * 0.42;
    let lift = 0;
    let tLift = 0;

    const handleMouseMove = (e: MouseEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      tLift = 1;
    };
    const handleMouseLeave = () => {
      tLift = 0;
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseleave", handleMouseLeave, { passive: true });

    const TWO_SIG2 = 2 * SIGMA * SIGMA;

    let heroVisible = true;
    const trigger = ScrollTrigger.create({
      trigger: ".landing-section",
      start: "top bottom",
      end: "bottom top",
      onToggle: (self) => {
        heroVisible = self.isActive;
        gsap.to(sheet, { opacity: heroVisible ? 1 : 0, duration: 0.5, ease: "power2.out" });
      },
    });

    const draw = () => {
      if (!heroVisible) return;
      if (tx > -9999) {
        bx += (tx - bx) * 0.12;
        by += (ty - by) * 0.12;
      }
      lift += (tLift - lift) * 0.06;

      sctx.clearRect(0, 0, iw, ih);

      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const ox = i * GAP;
          const oy = j * GAP;
          const dx = ox - bx;
          const dy = oy - by;
          const d2 = dx * dx + dy * dy;
          const h = lift * Math.exp(-d2 / TWO_SIG2);
          const d = Math.sqrt(d2) || 1;
          const push = h * LIFT;
          const x = ox + (dx / d) * push;
          const y = oy + (dy / d) * push - h * 10;

          const lightDot = (-dx - dy) / (d || 1);
          const shade = h * lightDot;
          const base = 0.05;
          const alpha = Math.max(0.02, Math.min(0.4, base + h * 0.32 + shade * 0.22));
          const r = 0.9 + h * 1.2;

          sctx.fillStyle = `rgba(${dotRGB}, ${alpha})`;
          sctx.beginPath();
          sctx.moveTo(x, y - r);
          sctx.lineTo(x + r, y);
          sctx.lineTo(x, y + r);
          sctx.lineTo(x - r, y);
          sctx.closePath();
          sctx.fill();
        }
      }
    };

    for (let k = 0; k < 4; k++) draw();
    gsap.ticker.add(draw);

    return () => {
      window.removeEventListener("resize", sizeSheet);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      gsap.ticker.remove(draw);
      trigger.kill();
    };
  }, []);

  return <canvas className="dome-sheet" ref={canvasRef} aria-hidden="true"></canvas>;
};

export default DomeSheet;
