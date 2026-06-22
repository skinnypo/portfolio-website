import "./styles/About.css";
import content from "../data";

const About = () => {
  return (
    <div className="about-section" id="about">
      <div className="about-me">
        <h3 className="title">THE MAN</h3>
        <p className="para">
          {content.bio?.aboutDescription ?? ""}
        </p>
      </div>
    </div>
  );
};

export default About;
