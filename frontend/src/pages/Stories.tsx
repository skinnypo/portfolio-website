import { useLayoutEffect, useState } from "react";
import { Link } from "react-router-dom";
import content from "../data";
import { formatTopic, isWorkTopic, normalizeTopic } from "../utils/topics";
import "./Stories.css";

const Stories = () => {
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  const [activeTopic, setActiveTopic] = useState<string | null>(null);

  const nonWorkArticles = content.articles
    .filter((article) => !isWorkTopic(article.topic))
    .sort((a, b) => a.order - b.order);

  const topics: string[] = [];
  nonWorkArticles.forEach((article) => {
    if (!topics.some((topic) => normalizeTopic(topic) === normalizeTopic(article.topic))) {
      topics.push(article.topic);
    }
  });

  const stories = activeTopic
    ? nonWorkArticles.filter(
        (article) => normalizeTopic(article.topic) === normalizeTopic(activeTopic)
      )
    : nonWorkArticles;

  return (
    <div className="stories-page">
      <div className="stories-header">
        <Link to="/" className="back-button" data-cursor="disable">
          ← Ride Back
        </Link>
        <Link to="/myworks" className="next-page-button" data-cursor="disable">
          See My Work →
        </Link>
        <h1>
          Off The <span>Clock</span>
        </h1>
        <p>Life, sports, and the roads that aren't on any project timeline.</p>
        {topics.length > 1 && (
          <div className="stories-filter">
            <button
              type="button"
              className={`stories-filter-btn${activeTopic === null ? " active" : ""}`}
              onClick={() => setActiveTopic(null)}
              data-cursor="disable"
            >
              All
            </button>
            {topics.map((topic) => (
              <button
                type="button"
                key={topic}
                className={`stories-filter-btn${activeTopic === topic ? " active" : ""}`}
                onClick={() => setActiveTopic(topic)}
                data-cursor="disable"
              >
                {topic}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="stories-grid">
        {stories.map((article, index) => (
          <Link
            to={`/articles/${article.slug}`}
            className="stories-card"
            key={article.id}
            data-cursor="disable"
          >
            <div className="stories-card-number">0{index + 1}</div>
            <div className="stories-card-image">
              {article.coverImage && (
                <img src={article.coverImage} alt={article.title} />
              )}
            </div>
            <div className="stories-card-info">
              <h3>{article.title}</h3>
              <p className="stories-card-topic">{formatTopic(article.topic, article.subtopic)}</p>
              <p className="stories-card-description">{article.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Stories;
