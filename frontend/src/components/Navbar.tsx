import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import HoverLinks from "./HoverLinks";
import { gsap } from "gsap";
import Lenis from "lenis";
import { FaGithub, FaLinkedinIn, FaXTwitter, FaInstagram } from "react-icons/fa6";
import "./styles/Navbar.css";
import content from "../data";

gsap.registerPlugin(ScrollTrigger);
export let lenis: Lenis | null = null;

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPhotoHovered, setIsPhotoHovered] = useState(false);
  const [isPhotoPinned, setIsPhotoPinned] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const initialsRef = useRef<HTMLSpanElement>(null);
  const fullNameRef = useRef<HTMLSpanElement>(null);
  const [initialsWidth, setInitialsWidth] = useState<number>();
  const [fullNameWidth, setFullNameWidth] = useState<number>();
  const bio = content.bio;
  const initials = bio?.fullName
    ? bio.fullName.split(" ").map((w) => w[0].toUpperCase()).join("")
    : "K";
  const showPhoto = isPhotoHovered || isPhotoPinned;

  useLayoutEffect(() => {
    setInitialsWidth(initialsRef.current?.offsetWidth);
    setFullNameWidth(fullNameRef.current?.offsetWidth);
  }, [initials, bio?.fullName]);
  useEffect(() => {
    // Initialize Lenis smooth scroll
    lenis = new Lenis({
      duration: 1.7,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1.7,
      touchMultiplier: 2,
      infinite: false,
    });

    // Start paused
    lenis.stop();

    // Keep GSAP ScrollTrigger in sync with Lenis's smoothed scroll position
    lenis.on("scroll", ScrollTrigger.update);

    // Handle smooth scroll animation frame
    function raf(time: number) {
      lenis?.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Handle navigation links
    let links = document.querySelectorAll(".header ul a");
    links.forEach((elem) => {
      let element = elem as HTMLAnchorElement;
      element.addEventListener("click", (e) => {
        if (window.innerWidth > 1024) {
          e.preventDefault();
          let elem = e.currentTarget as HTMLAnchorElement;
          let section = elem.getAttribute("data-href");
          if (section && lenis) {
            const target = document.querySelector(section) as HTMLElement;
            if (target) {
              lenis.scrollTo(target, {
                offset: 0,
                duration: 1.5,
              });
            }
          }
        }
      });
    });

    // Handle resize
    window.addEventListener("resize", () => {
      lenis?.resize();
    });

    // Only show the navbar's zigzag ribbon while the landing section is in view
    const zigzagTrigger = ScrollTrigger.create({
      trigger: ".landing-section",
      // small negative buffer: Lenis's eased scroll can settle a hair below 0
      // right at the top boundary, which would otherwise fail a strict >= 0 check
      start: -100,
      end: "bottom top",
      toggleClass: { targets: ".header", className: "at-landing" },
    });

    return () => {
      lenis?.destroy();
      zigzagTrigger.kill();
    };
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  return (
    <>
      <div className="header" ref={headerRef}>
        <div className="navbar-title-wrapper">
          <a
            href="/#"
            className="navbar-title"
            data-cursor="disable"
            style={{ width: (showPhoto ? fullNameWidth : initialsWidth) ?? "auto" }}
            onMouseEnter={() => setIsPhotoHovered(true)}
            onMouseLeave={() => setIsPhotoHovered(false)}
            onClick={(e) => { e.preventDefault(); setIsPhotoPinned((v) => !v); }}
          >
            <span
              ref={initialsRef}
              className="navbar-title-text"
              style={{ opacity: showPhoto ? 0 : 1 }}
            >
              {initials}
            </span>
            <span
              ref={fullNameRef}
              className="navbar-title-text"
              style={{ opacity: showPhoto ? 1 : 0 }}
            >
              {bio?.fullName ?? initials}
            </span>
          </a>
          <div className={`navbar-photo-popup${showPhoto ? " visible" : ""}`}>
            {bio?.photo ? (
              <img src={bio.photo} alt={bio.fullName} />
            ) : (
              <span>{initials}</span>
            )}
          </div>
        </div>
        <div className="navbar-social" data-cursor="disable">
          {bio?.github && (
            <a href={bio.github} target="_blank" rel="noopener noreferrer">
              <FaGithub />
            </a>
          )}
          {bio?.linkedin && (
            <a href={bio.linkedin} target="_blank" rel="noopener noreferrer">
              <FaLinkedinIn />
            </a>
          )}
          {bio?.twitter && (
            <a href={bio.twitter} target="_blank" rel="noopener noreferrer">
              <FaXTwitter />
            </a>
          )}
          {bio?.instagram && (
            <a href={bio.instagram} target="_blank" rel="noopener noreferrer">
              <FaInstagram />
            </a>
          )}
        </div>
        <button
          className={`hamburger${isOpen ? " open" : ""}`}
          onClick={() => setIsOpen((v) => !v)}
          data-cursor="disable"
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <ul>
          <li>
            <a data-href="#about" href="#about">
              <HoverLinks text="ABOUT" />
            </a>
          </li>
          <li>
            <a data-href="#experience" href="#experience">
              <HoverLinks text="EXPERIENCES" />
            </a>
          </li>
          <li>
            <a data-href="#work" href="#work">
              <HoverLinks text="WORK" />
            </a>
          </li>
          <li>
            <a data-href="#get-in-touch" href="#get-in-touch">
              <HoverLinks text="CONTACT" />
            </a>
          </li>
        </ul>
        <div className={`mobile-nav${isOpen ? " open" : ""}`}>
          <ul>
            <li>
              <a href="#about" onClick={() => setIsOpen(false)}>
                ABOUT
              </a>
            </li>
            <li>
              <a href="#experience" onClick={() => setIsOpen(false)}>
                EXPERIENCES
              </a>
            </li>
            <li>
              <a href="#work" onClick={() => setIsOpen(false)}>
                WORK
              </a>
            </li>
            <li>
              <a href="#get-in-touch" onClick={() => setIsOpen(false)}>
                CONTACT
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="nav-fade"></div>
    </>
  );
};

export default Navbar;
