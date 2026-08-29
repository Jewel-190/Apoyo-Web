import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Scrolls the app content pane to the top whenever the route pathname changes. */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const scroller = document.getElementById("app-scroll");
    if (scroller) {
      scroller.scrollTo(0, 0);
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
};

export default ScrollToTop;
