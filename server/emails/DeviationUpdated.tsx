import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Hr,
  Row,
  Column,
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

export const DeviationUpdatedEmail = ({
  deviation,
  changedBy,
  type,
  department,
  status,
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
              <Hr className="my-[16px] border-gray-300 border-t-2" />
              <Row>
                <Column>
                  <Text style={styles.metaText}>
                    <strong>Uppdaterad av:</strong> {changedByName}
                  </Text>
                </Column>
                <Column>
                  {deviation.dueDate && (
                    <Text style={styles.metaText}>
                      <strong>Förfallodatum:</strong>{" "}
                      {new Date(deviation.dueDate).toLocaleDateString("sv-SE")}
                    </Text>
                  )}
                </Column>
              </Row>
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
