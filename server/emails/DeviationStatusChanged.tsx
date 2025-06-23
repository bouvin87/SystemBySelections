import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface DeviationStatusChangedEmailProps {
  deviation: any;
  oldStatus: any;
  newStatus: any;
  changedBy: any;
  type: any;
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

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={headerText}>System by Selection</Text>
            <Text style={headerSubtext}>Statusändring</Text>
          </Section>

          <Section style={content}>
            <Text style={h1}>Avvikelse statusändring</Text>
            
            <Section style={deviationCard}>
              <Text style={deviationTitle}>{deviation.title}</Text>
              
              <Section style={statusSection}>
                <Text style={label}>Status ändrad:</Text>
                <Section style={statusChange}>
                  <span style={{
                    ...statusBadge,
                    backgroundColor: oldStatus.color || '#6b7280'
                  }}>
                    {oldStatus.name}
                  </span>
                  <Text style={arrow}>→</Text>
                  <span style={{
                    ...statusBadge,
                    backgroundColor: newStatus.color || '#6b7280'
                  }}>
                    {newStatus.name}
                  </span>
                </Section>
              </Section>

              <Text style={metaText}>
                <strong>Typ:</strong> {type.name}
              </Text>
              
              <Text style={metaText}>
                <strong>Beskrivning:</strong> {deviation.description || 'Ingen beskrivning'}
              </Text>
              
              <Text style={metaText}>
                <strong>Ändrad av:</strong> {changedBy.firstName} {changedBy.lastName}
              </Text>
              
              {deviation.dueDate && (
                <Text style={metaText}>
                  <strong>Förfallodatum:</strong> {new Date(deviation.dueDate).toLocaleDateString('sv-SE')}
                </Text>
              )}
            </Section>

            <Section style={buttonContainer}>
              <Button
                style={button}
                href={`${baseUrl}/deviations/${deviation.id}`}
              >
                Visa avvikelse
              </Button>
            </Section>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              Detta meddelande skickades automatiskt från System by Selection.
            </Text>
            <Text style={footerText}>
              <Link href={`mailto:unsubscribe@systembyselections.se`} style={unsubscribeLink}>
                Avprenumerera
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default DeviationStatusChangedEmail;

// Enhanced styles matching DeviationUpdated
const main = {
  backgroundColor: '#f8fafc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  marginTop: '20px',
  marginBottom: '20px',
  marginLeft: 'auto',
  marginRight: 'auto',
  maxWidth: '600px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
};

const header = {
  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
  padding: '32px 40px',
  borderRadius: '12px 12px 0 0',
};

const headerText = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: '700',
  margin: '0 0 4px',
  textAlign: 'center' as const,
};

const headerSubtext = {
  color: 'rgba(255, 255, 255, 0.9)',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0',
  textAlign: 'center' as const,
};

const content = {
  padding: '40px',
};

const h1 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: '600',
  margin: '0 0 20px',
  textAlign: 'center' as const,
};

const deviationCard = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '24px',
  margin: '20px 0',
};

const deviationTitle = {
  color: '#1f2937',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 16px',
};

const statusSection = {
  margin: '16px 0',
};

const label = {
  color: '#374151',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 8px',
};

const statusChange = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  margin: '8px 0',
};

const statusBadge = {
  color: '#ffffff',
  fontSize: '12px',
  fontWeight: '500',
  padding: '4px 8px',
  borderRadius: '4px',
  display: 'inline-block',
};

const arrow = {
  color: '#6b7280',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 4px',
};

const metaText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '8px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

const footer = {
  borderTop: '1px solid #e6ebf1',
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '1.5',
  padding: '20px 0',
  textAlign: 'center' as const,
};

const footerText = {
  margin: '0 0 8px',
};

const unsubscribeLink = {
  color: '#8898aa',
  textDecoration: 'underline',
};