import { useEffect, useState } from "react";
import "./styles/Work.css";
import "./styles/StoriesSection.css";
import content from "../data";
import { Link } from "react-router-dom";
import { formatTopic, isWorkTopic } from "../utils/topics";

const FALLBACK_IMAGES = ["/images/lifestories.png"];
const SLIDE_INTERVAL_MS = 7000;

const StoriesSection = () => {
  const stories = content.articles
    .filter((article) => !isWorkTopic(article.topic))
    .sort((a, b) => a.order - b.order)
    .slice(0, 3);

  const images = content.bio?.lifePhotos?.length ? content.bio.lifePhotos : FALLBACK_IMAGES;
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (images.length < 2) return;
    const timer = setInterval(() => {
      setActiveIndex((i) => (i + 1) % images.length);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <div className="stories-section" id="stories">
      <div className="stories-container section-container">
        <h2>
          BEYOND THE <span>WORK</span>
        </h2>
        <div className="stories-layout">
          <div className="stories-image">
            {images.map((src, index) => (
              <img
                key={src}
                src={src}
                alt="Life stories"
                className={`stories-image-slide${index === activeIndex ? " is-active" : ""}`}
              />
            ))}
            {images.length > 1 && (
              <div className="stories-image-dots">
                {images.map((src, index) => (
                  <button
                    key={src}
                    type="button"
                    className={`stories-image-dot${index === activeIndex ? " is-active" : ""}`}
                    aria-label={`Show photo ${index + 1}`}
                    onClick={() => setActiveIndex(index)}
                    data-cursor="disable"
                  />
                ))}
              </div>
            )}
          </div>
          <div className="stories-list">
            {stories.map((article) => (
              <Link
                to={`/articles/${article.slug}`}
                className="story-card"
                key={article.id}
                data-cursor="disable"
              >
                <p className="story-card-topic">{formatTopic(article.topic, article.subtopic)}</p>
                <h3>{article.title}</h3>
                <p className="story-card-description">{article.description}</p>
              </Link>
            ))}
          </div>
        </div>
        <Link to="/stories" className="see-all-btn" data-cursor="disable">
          Explore All Stories →
        </Link>
      </div>
    </div>
  );
};

export default StoriesSection;
