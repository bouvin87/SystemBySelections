import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";
import EmailFooter from "./EmailFooter";
import { emailStyles as styles } from "./EmailStyles";
import DeviationInfoBox from "./DeviationInfoBox";
import { Badge } from "@/components/ui/badge";

interface DeviationCommentAddedEmailProps {
  deviation: {
    id: number;
    title: string;
    description?: string;
  };
  comment: string;
  commenter: {
    firstName?: string;
    lastName?: string;
    email: string;
  };
  type: {
    name: string;
    color: string;
  };
  department: {
    name: string;
    color: string;
  };
  status: {
    name: string;
    color: string;
  };
  baseUrl: string;
}

export const DeviationCommentAddedEmail = ({
  deviation,
  comment,
  commenter,
  type,
  department,
  status,
  baseUrl,
}: DeviationCommentAddedEmailProps) => {
  const previewText = `Ny kommentar på ärende: ${deviation.title}`;
  const commenterName =
    `${commenter.firstName || ""} ${commenter.lastName || ""}`.trim() ||
    commenter.email;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Text style={styles.headerText}>System by Selections</Text>
            <Text style={styles.headerSubtext}>Avvikelsehantering</Text>
          </Section>

          <Section style={styles.content}>
            <Text style={styles.h1}>Ny kommentar har lagts till</Text>
            <Section style={styles.deviationCard}>
              <Text style={styles.deviationTitle}>
                <strong>Rubrik:</strong>
                {deviation.title}
              </Text>
              {deviation.description && (
                <Text style={styles.metaText}>
                  <strong>Beskrivning:</strong> {deviation.description}
                </Text>
              )}
              <span
                style={{
                  display: "inline-block",
                  padding: "2px 8px",
                  fontSize: "12px",
                  fontWeight: 600,
                  borderRadius: "4px",
                  border: `1px solid ${status.color}`,
                  color: status.color,
                  backgroundColor: "transparent",
                  marginRight: "1em",
                }}
              >
                {status.name}
              </span>
              <span
                style={{
                  display: "inline-block",
                  padding: "2px 8px",
                  fontSize: "12px",
                  fontWeight: 600,
                  borderRadius: "4px",
                  border: `1px solid ${type.color}`,
                  color: type.color,
                  backgroundColor: "transparent",
                  marginRight: "1em",
                }}
              >
                {type.name}
              </span>
              <span
                style={{
                  display: "inline-block",
                  padding: "2px 8px",
                  fontSize: "12px",
                  fontWeight: 600,
                  borderRadius: "4px",
                  border: `1px solid ${department.color}`,
                  color: department.color,
                  backgroundColor: "transparent",
                  marginRight: "1em",
                }}
              >
                {department.name}
              </span>
            </Section>
            <Section style={styles.commentCard}>
              <Text style={styles.commentHeader}>
                <strong>
                  {commenter.firstName} {commenter.lastName}
                </strong>{" "}
                kommenterade:
              </Text>
              <Text style={styles.commentText}>"{comment}"</Text>
              <Text style={styles.commentMeta}>
                {new Date().toLocaleString("sv-SE")}
              </Text>
            </Section>

            <Section style={styles.buttonContainer}>
              <Button
                style={styles.button}
                href={`${baseUrl}/deviations/${deviation.id}`}
              >
                Visa avvikelse
              </Button>
            </Section>
            <DeviationInfoBox />
          </Section>

          <EmailFooter />
        </Container>
      </Body>
    </Html>
  );
};

export default DeviationCommentAddedEmail;
