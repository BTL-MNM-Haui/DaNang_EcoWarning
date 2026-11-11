
import React from "react";
import "../../styles/components/_footer.scss";

const Footer = () => {
  return (
    <footer className="footer">
      <p>© {new Date().getFullYear()} Bản quyền thuộc về HIT.</p>
    </footer>
  );
};

export default Footer;
