import { useLayoutEffect } from "react";
import { Link } from "react-router-dom";
import content from "../data";
import { isWorkTopic } from "../utils/topics";
import "./MyWorks.css";

const MyWorks = () => {
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  return (
    <div className="myworks-page">
      <div className="myworks-header">
        <Link to="/" className="back-button" data-cursor="disable">
          ← Ride Back
        </Link>
        <Link to="/stories" className="next-page-button" data-cursor="disable">
          Explore Stories →
        </Link>
        <h1>
          Under The <span>Hood</span>
        </h1>
        <p>Every project I've engineered, from spec to ship.</p>
      </div>

      <div className="myworks-grid">
        {content.articles
          .filter((article) => isWorkTopic(article.topic))
          .sort((a, b) => a.order - b.order)
          .map((article, index) => (
            <Link
              to={`/articles/${article.slug}`}
              className="myworks-card"
              key={article.id}
              data-cursor="disable"
            >
              <div className="myworks-card-number">0{index + 1}</div>
              <div className="myworks-card-image">
                <img src={article.coverImage ?? ""} alt={article.title} />
              </div>
              <div className="myworks-card-info">
                <h3>{article.title}</h3>
                {article.subtopic && (
                  <p className="myworks-card-category">{article.subtopic}</p>
                )}
                <p className="myworks-card-description">{article.description}</p>
                {article.technologies && (
                  <p className="myworks-card-tech">{article.technologies}</p>
                )}
              </div>
            </Link>
          ))}
      </div>
    </div>
  );
};

export default MyWorks;
