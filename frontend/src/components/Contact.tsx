import { MdArrowOutward, MdCopyright } from "react-icons/md";
import { Link } from "react-router-dom";
import "./styles/Contact.css";
import "./styles/CallToAction.css";
import content from "../data";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect } from "react";

gsap.registerPlugin(ScrollTrigger);

const Contact = () => {
  const bio = content.bio;

  useEffect(() => {
    const contactTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: ".contact-section",
        start: "top 80%",
        end: "bottom center",
        toggleActions: "play none none none",
      },
    });

    contactTimeline.fromTo(
      ".contact-box",
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.15, ease: "power3.out" },
      "-=0.4"
    );

    return () => { contactTimeline.kill(); };
  }, []);

  return (
    <div className="contact-section section-container" id="contact">
      <div className="contact-container">
        <div className="contact-flex">
          <div className="contact-box">
            <h4>Email</h4>
            <p>
              <a href={`mailto:${bio?.email ?? ""}`} data-cursor="disable">
                {bio?.email ?? ""}
              </a>
            </p>
            <h4>Location</h4>
            <p><span>{bio?.location ?? ""}</span></p>
          </div>
          <div className="contact-box">
            <h4>Social</h4>
            <a href={bio?.github ?? "#"} target="_blank" rel="noopener noreferrer" data-cursor="disable" className="contact-social">
              Github <MdArrowOutward />
            </a>
            <a href={bio?.linkedin ?? "#"} target="_blank" rel="noopener noreferrer" data-cursor="disable" className="contact-social">
              Linkedin <MdArrowOutward />
            </a>
            {bio?.twitter && (
              <a href={bio.twitter} target="_blank" rel="noopener noreferrer" data-cursor="disable" className="contact-social">
                Twitter <MdArrowOutward />
              </a>
            )}
            {bio?.facebook && (
              <a href={bio.facebook} target="_blank" rel="noopener noreferrer" data-cursor="disable" className="contact-social">
                Facebook <MdArrowOutward />
              </a>
            )}
            {bio?.instagram && (
              <a href={bio.instagram} target="_blank" rel="noopener noreferrer" data-cursor="disable" className="contact-social">
                Instagram <MdArrowOutward />
              </a>
            )}
          </div>
        </div>
        <div className="contact-bottom">
          <div className="contact-actions">
            <Link to="/play" className="cta-btn cta-btn-play" data-cursor="disable">
              Play With Me →
            </Link>
            <a
              href={bio?.linkedin ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="cta-btn cta-btn-hire"
              data-cursor="disable"
            >
              Hire Me →
            </a>
          </div>
          <p className="contact-copyright">
            <MdCopyright /> {new Date().getFullYear()} All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Contact;
