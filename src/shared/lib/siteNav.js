/**
 * Primary site navigation. Locked in code so clients cannot change IA from the CMS.
 * Keep in sync with routes in App.jsx (Home, Services, About).
 */
export const SITE_NAV_LINKS = Object.freeze([
  Object.freeze({ name: "Home", path: "/" }),
  Object.freeze({ name: "Services", path: "/services" }),
  Object.freeze({ name: "About Us", path: "/about" }),
]);

export const NAV_MENU_OPEN_LABEL = "Open menu";
export const NAV_MENU_CLOSE_LABEL = "Close menu";
