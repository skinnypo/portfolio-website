import { useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./NotFoundMessage.css";

const NotFoundMessage = () => {
  const navigate = useNavigate();

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  const handleRideBack = () => {
    const historyIndex = (window.history.state as { idx?: number } | null)?.idx;
    if (typeof historyIndex === "number" && historyIndex > 0) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="not-found-page">
      <div className="not-found-header">
        <button type="button" className="not-found-back-button" onClick={handleRideBack} data-cursor="disable">
          ← Ride Back
        </button>
      </div>
      <div className="not-found-content">
        <h1>404</h1>
        <p>This page doesn't exist, or it's moved on.</p>
      </div>
    </div>
  );
};

export default NotFoundMessage;
