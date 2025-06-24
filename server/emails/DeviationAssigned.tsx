import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Html,
  Hr,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";
import EmailFooter from "./EmailFooter";
import { emailStyles as styles } from "./EmailStyles";
import DeviationInfoBox from "./DeviationInfoBox";

interface DeviationAssignedEmailProps {
  deviation: {
    id: number;
    title: string;
    description?: string;
    dueDate?: string;
  };
  assignedUser: {
    firstName?: string;
    lastName?: string;
  };
  assigner: {
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

export const DeviationAssignedEmail = ({
  deviation,
  assignedUser,
  assigner,
  type,
  department,
  status,
  baseUrl,
}: DeviationAssignedEmailProps) => {
  const previewText = `Du har tilldelats avvikelse: ${deviation.title}`;
  const assignerName =
    `${assigner.firstName || ""} ${assigner.lastName || ""}`.trim();
  const recipientName =
    `${assignedUser.firstName || ""} ${assignedUser.lastName || ""}`.trim();

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Text style={styles.headerText}>System by Selections</Text>
            <Text style={styles.headerSubtext}>Avvikelse tilldelad</Text>
          </Section>

          <Section style={styles.content}>
            <Text style={styles.h1}>Du har tilldelats en avvikelse</Text>

            <Text style={{ ...styles.metaText, marginBottom: "24px" }}>
              Hej {recipientName || "användare"}, du har blivit tilldelad en ny avvikelse.
            </Text>

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
                  marginRight: "1em",
                }}
              >
                {department.name}
              </span>

              <Hr className="my-[16px] border-gray-300 border-t-2" />

              <Row>
                <Column>
                  <Text style={styles.metaText}>
                    <strong>Tilldelad av:</strong> {assignerName}
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
                Hantera avvikelse
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

export default DeviationAssignedEmail;
