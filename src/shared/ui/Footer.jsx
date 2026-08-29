import React from "react";
import ScrollReveal from "./ScrollReveal";
import { instrument } from "../lib/fonts";
import { useGlobalContent } from "../content/WebContentContext";
import { RichText, plainText } from "../content/richText";
import ContentImage from "./ContentImage";

const Footer = () => {
  const footer = useGlobalContent().footer ?? {};
  const copyright = (footer.copyright ?? "").replaceAll("{year}", String(new Date().getFullYear()));

  return (
    <ScrollReveal
      as="footer"
      className="w-full border-t border-gray-100/80 bg-gradient-to-r from-brand-page-from to-brand-page-to px-4 py-12"
      delay={60}
    >
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 text-center">
        {footer.dasmaLogo || footer.dasmaBanner ? (
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {footer.dasmaLogo ? (
              <ContentImage
                src={footer.dasmaLogo}
                alt={plainText(footer.dasmaLogoAlt) || "Dasmariñas Logo"}
                slot="logoFooter"
              />
            ) : null}
            {footer.dasmaBanner ? (
              <ContentImage
                src={footer.dasmaBanner}
                alt={plainText(footer.dasmaBannerAlt) || "Dasmariñas Banner"}
                slot="logoFooterBanner"
              />
            ) : null}
          </div>
        ) : null}
        {footer.tagline ? (
          <RichText
            as="p"
            value={footer.tagline}
            className="max-w-md text-sm leading-relaxed text-gray-600"
            style={instrument}
          />
        ) : null}
        {copyright ? (
          <p className="text-sm text-gray-500" style={instrument}>
            {copyright}
          </p>
        ) : null}
      </div>
    </ScrollReveal>
  );
};

export default Footer;
