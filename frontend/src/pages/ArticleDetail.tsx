import { useLayoutEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import content from "../data";
import { formatTopic } from "../utils/topics";
import "./ArticleDetail.css";

const ArticleDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [slug]);

  const article = content.articles.find(
    (a) => a.slug.toLowerCase() === (slug ?? "").toLowerCase()
  );

  const handleRideBack = () => {
    const historyIndex = (window.history.state as { idx?: number } | null)?.idx;
    if (typeof historyIndex === "number" && historyIndex > 0) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  if (!article) {
    return (
      <div className="article-page">
        <div className="article-header">
          <button type="button" className="back-button" onClick={handleRideBack} data-cursor="disable">
            ← Ride Back
          </button>
        </div>
        <div className="article-not-found">
          <h1>Article not found</h1>
          <p>This one doesn't exist, or it's moved on.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="article-page">
      <div className="article-header">
        <button type="button" className="back-button" onClick={handleRideBack} data-cursor="disable">
          ← Ride Back
        </button>
      </div>
      <div className="article-content">
        {article.coverImage && (
          <div className="article-cover">
            <img src={article.coverImage} alt={article.title} />
          </div>
        )}
        <p className="article-topic">{formatTopic(article.topic, article.subtopic)}</p>
        <h1>{article.title}</h1>
        {article.technologies && (
          <p className="article-technologies">{article.technologies}</p>
        )}
        <div className="article-body">
          <ReactMarkdown>{article.body}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default ArticleDetail;
