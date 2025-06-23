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

interface DeviationStatusChangedEmailProps {
  deviation: {
    id: number;
    title: string;
    description?: string;
    dueDate?: string;
  };
  oldStatus: {
    name: string;
    color?: string;
  };
  newStatus: {
    name: string;
    color?: string;
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

export const DeviationStatusChangedEmail = ({
  deviation,
  oldStatus,
  newStatus,
  changedBy,
  type,
  baseUrl,
}: DeviationStatusChangedEmailProps) => {
  const previewText = `Status ändrad för avvikelse: ${deviation.title}`;
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
            <Text style={styles.headerSubtext}>Statusändring</Text>
          </Section>

          <Section style={styles.content}>
            <Text style={styles.h1}>Avvikelsens status har ändrats</Text>

            <Section style={styles.deviationCard}>
              <Text style={styles.deviationTitle}>{deviation.title}</Text>

              {/* Statusändring */}
              <Section style={{ margin: "16px 0" }}>
                <Text style={{ ...styles.metaText, fontWeight: "600" }}>
                  Status ändrad:
                </Text>
                <Section
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    margin: "8px 0",
                  }}
                >
                  <span
                    style={{
                      backgroundColor: oldStatus.color || "#6b7280",
                      color: "#fff",
                      fontSize: "12px",
                      fontWeight: 500,
                      padding: "4px 8px",
                      borderRadius: "4px",
                      display: "inline-block",
                    }}
                  >
                    {oldStatus.name}
                  </span>
                  <Text style={{ color: "#6b7280", fontSize: "16px" }}>→</Text>
                  <span
                    style={{
                      backgroundColor: newStatus.color || "#6b7280",
                      color: "#fff",
                      fontSize: "12px",
                      fontWeight: 500,
                      padding: "4px 8px",
                      borderRadius: "4px",
                      display: "inline-block",
                    }}
                  >
                    {newStatus.name}
                  </span>
                </Section>
              </Section>

              <Text style={styles.metaText}>
                <strong>Typ:</strong> {type.name}
              </Text>

              <Text style={styles.metaText}>
                <strong>Beskrivning:</strong>{" "}
                {deviation.description || "Ingen beskrivning"}
              </Text>

              <Text style={styles.metaText}>
                <strong>Ändrad av:</strong> {changedByName}
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

export default DeviationStatusChangedEmail;
