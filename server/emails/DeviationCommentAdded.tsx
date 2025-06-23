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
  };
  department?: {
    name: string;
  };
  baseUrl: string;
}

export const DeviationCommentAddedEmail = ({
  deviation,
  comment,
  commenter,
  type,
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
              <Text style={styles.metaText}>
                <strong>Typ:</strong> {type.name}
              </Text>
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
