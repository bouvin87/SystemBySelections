import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Row,
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
  department?: {
    name: string;
    color: string;
  };
  status?: {
    name: string;
    color: string;
  };
  baseUrl?: string;
}

export const DeviationCreatedEmail = ({
  deviation,
  creator,
  type,
  department,
  status,
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
                  border: `1px solid ${status?.color || '#3b82f6'}`,
                  color: status?.color || "#3b82f6",
                  backgroundColor: "transparent",
                  marginRight: "1em",
                }}
              >
                {status?.name || "Ny"}
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
                  border: `1px solid ${department?.color}`,
                  color: department?.color,
                  backgroundColor: "transparent",
                }}
              >
                {department?.name}
              </span>
              <Hr className="my-[16px] border-gray-300 border-t-2" />
              <Row>
                <Column>
                  <Text style={styles.metaText}>
                    <strong>Skapad av:</strong> {creatorName}
                  </Text>
                </Column>
                <Column>
                  <Text style={styles.metaText}>
                    <strong>Datum:</strong>{" "}
                    {new Date(deviation.createdAt).toLocaleString("sv-SE")}
                  </Text>
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

export default DeviationCreatedEmail;
