import { Section, Text } from "@react-email/components";
import * as React from "react";

export const EmailFooter = () => {
  return (
    <Section style={footer}>
      <Text style={footerText}>
        Detta meddelande skickades automatiskt från System by Selections.
      </Text>
    </Section>
  );
};

export default EmailFooter;

const footer = {
  borderTop: "1px solid #e2e8f0",
  color: "#64748b",
  fontSize: "12px",
  lineHeight: "1.5",
  padding: "24px 40px",
  textAlign: "center" as const,
};

const footerText = {
  margin: "0 0 8px",
};
