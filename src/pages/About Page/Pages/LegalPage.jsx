import React from "react";
import { Navigate, useParams } from "react-router-dom";
import { LegalShell } from "../AboutPage";
import { useLegalContent } from "../../../shared/content/WebContentContext";
import { RichText } from "../../../shared/content/richText";
import {
  LEGAL_PAGE_PATH,
  getHardcodedLegalPage,
  getLegalPageSections,
} from "../../../shared/lib/legalSettings";

export function LegalIndexRedirect() {
  return <Navigate to={LEGAL_PAGE_PATH} replace />;
}

const LegalPage = () => {
  const { slug } = useParams();
  const legal = useLegalContent();
  const page = getHardcodedLegalPage(slug);

  if (!page) {
    return <Navigate to={LEGAL_PAGE_PATH} replace />;
  }

  const sections = getLegalPageSections(legal, page.slug);

  return (
    <LegalShell title={page.title}>
      {sections.map((section, index) => (
        <section key={index}>
          {section.heading ? (
            <h2 className="mb-2 text-base font-semibold text-gray-900">{section.heading}</h2>
          ) : null}
          <RichText as="div" value={section.body} />
        </section>
      ))}
    </LegalShell>
  );
};

export default LegalPage;
