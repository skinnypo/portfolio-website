import "./styles/Work.css";
import WorkImage from "./WorkImage";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect } from "react";
import content from "../data";
import { Link } from "react-router-dom";
import { isWorkTopic } from "../utils/topics";

gsap.registerPlugin(ScrollTrigger);

const Work = () => {
  useEffect(() => {
    if (window.innerWidth <= 768) return;

    let translateX: number = 0;

    function setTranslateX() {
      const box = document.getElementsByClassName("work-box");
      if (box.length === 0) return;
      const rectLeft = document
        .querySelector(".work-container")!
        .getBoundingClientRect().left;
      const rect = box[0].getBoundingClientRect();
      const parentWidth = box[0].parentElement!.getBoundingClientRect().width;
      let padding: number =
        parseInt(window.getComputedStyle(box[0]).padding) / 2;
      translateX = rect.width * box.length - (rectLeft + parentWidth) + padding;
    }

    setTranslateX();

    let timeline = gsap.timeline({
      scrollTrigger: {
        trigger: ".work-section",
        start: "top top",
        end: `+=${translateX}`,
        scrub: 1,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        id: "work",
        invalidateOnRefresh: true,
      },
    });

    timeline.to(".work-flex", { x: -translateX, ease: "none" });

    ScrollTrigger.refresh();

    return () => {
      timeline.kill();
      ScrollTrigger.getById("work")?.kill();
    };
  }, []);

  return (
    <div className="work-section" id="work">
      <div className="work-container section-container">
        <h2>
          THINGS I'VE <span>MADE</span>
        </h2>
        <div className="work-flex">
          {content.articles
            .filter((article) => isWorkTopic(article.topic))
            .sort((a, b) => a.order - b.order)
            .slice(0, 3)
            .map((article, index) => (
              <Link
                to={`/articles/${article.slug}`}
                className="work-box"
                key={article.id}
                data-cursor="disable"
              >
                <div className="work-info">
                  <div className="work-title">
                    <h3>0{index + 1}</h3>
                    <div>
                      <h4>{article.title}</h4>
                      {article.subtopic && <p>{article.subtopic}</p>}
                    </div>
                  </div>
                  <p>{article.description}</p>
                  {article.technologies && (
                    <p className="work-technologies">{article.technologies}</p>
                  )}
                </div>
                <WorkImage image={article.coverImage ?? ""} alt={article.title} />
              </Link>
            ))}
          <div className="work-box work-box-cta">
            <div className="see-all-works">
              <h3>Want to see more?</h3>
              <p>All the things I've built, in one place.</p>
              <Link to="/myworks" className="see-all-btn" data-cursor="disable">
                See All Works →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Work;
