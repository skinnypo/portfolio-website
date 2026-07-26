import "./styles/Work.css";
import "./styles/StoriesSection.css";
import content from "../data";
import { Link } from "react-router-dom";
import { formatTopic, isWorkTopic } from "../utils/topics";

const StoriesSection = () => {
  const stories = content.articles
    .filter((article) => !isWorkTopic(article.topic))
    .sort((a, b) => a.order - b.order)
    .slice(0, 3);

  return (
    <div className="stories-section" id="stories">
      <div className="stories-container section-container">
        <h2>
          BEYOND THE <span>WORK</span>
        </h2>
        <div className="stories-layout">
          <div className="stories-image">
            <img src="/images/lifestories.png" alt="Life stories" />
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
