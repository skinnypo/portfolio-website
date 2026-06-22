import { MdCopyright } from "react-icons/md";
import "./styles/Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <p className="footer-copyright">
        <MdCopyright /> {new Date().getFullYear()} All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;
