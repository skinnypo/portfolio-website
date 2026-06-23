import { useLayoutEffect } from "react";
import { Link } from "react-router-dom";
import content from "../data";
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
        <h1>
          The Full <span>Haul</span>
        </h1>
        <p>Everything I've shipped, start to finish.</p>
      </div>

      <div className="myworks-grid">
        {content.projects.map((project, index) => (
          <div className="myworks-card" key={project.id} data-cursor="disable">
            <div className="myworks-card-number">0{index + 1}</div>
            <div className="myworks-card-image">
              <img src={project.image ?? ""} alt={project.title} />
            </div>
            <div className="myworks-card-info">
              <h3>{project.title}</h3>
              <p className="myworks-card-category">{project.category}</p>
              <p className="myworks-card-description">{project.description}</p>
              <p className="myworks-card-tech">{project.technologies}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyWorks;
