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
interface DeviationUpdatedEmailProps {
  deviation: {
    id: number;
    title: string;
    description?: string;
    dueDate?: string;
  };
  changedBy: {
    firstName?: string;
    lastName?: string;
  };
  type: {
    name: string;
  };
  baseUrl: string;
}

export const DeviationUpdatedEmail = ({
  deviation,
  changedBy,
  type,
  baseUrl,
}: DeviationUpdatedEmailProps) => {
  const previewText = `Avvikelse uppdaterad: ${deviation.title}`;
  const changedByName =
    `${changedBy.firstName || ""} ${changedBy.lastName || ""}`.trim();

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
            <Text style={styles.h1}>Avvikelse uppdaterad</Text>

            <Section style={styles.deviationCard}>
              <Text style={styles.deviationTitle}>{deviation.title}</Text>

              <Text style={styles.metaText}>
                <strong>Typ:</strong> {type.name}
              </Text>

              <Text style={styles.metaText}>
                <strong>Beskrivning:</strong>{" "}
                {deviation.description || "Ingen beskrivning"}
              </Text>

              <Text style={styles.metaText}>
                <strong>Uppdaterad av:</strong> {changedByName}
              </Text>

              {deviation.dueDate && (
                <Text style={styles.metaText}>
                  <strong>Förfallodatum:</strong>{" "}
                  {new Date(deviation.dueDate).toLocaleDateString("sv-SE")}
                </Text>
              )}
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

export default DeviationUpdatedEmail;
