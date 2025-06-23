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
import { emailStyles as styles } from "./EmailStyles";
import EmailFooter from "./EmailFooter";
import DeviationInfoBox from "./DeviationInfoBox";

interface DeviationCreatedEmailProps {
  deviation: {
    id: number;
    title: string;
    description?: string;
    createdAt: string;
  };
  creator: {
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
  };
  baseUrl?: string;
}

export const DeviationCreatedEmail = ({
  deviation,
  creator,
  type,
  department,
  baseUrl = "http://localhost:5000",
}: DeviationCreatedEmailProps) => {
  const previewText = `Ny avvikelse: ${deviation.title}`;
  const creatorName =
    `${creator.firstName || ""} ${creator.lastName || ""}`.trim() ||
    creator.email;

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
            <Text style={styles.h1}>Ny avvikelse har skapats</Text>

            <Section style={styles.deviationCard}>
              <Text style={styles.deviationTitle}>
                <strong>Rubrik:</strong>
                {deviation.title}
              </Text>

              <Text style={styles.metaText}>
                <strong>Typ:</strong> {type.name}
              </Text>

              <Text style={styles.metaText}>
                <strong>Avdelning:</strong> {department.name}
              </Text>

              {deviation.description && (
                <Text style={styles.metaText}>
                  <strong>Beskrivning:</strong> {deviation.description}
                </Text>
              )}

              <Text style={styles.metaText}>
                <strong>Skapad av:</strong> {creatorName}
              </Text>

              <Text style={styles.metaText}>
                <strong>Datum:</strong>{" "}
                {new Date(deviation.createdAt).toLocaleString("sv-SE")}
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

export default DeviationCreatedEmail;
