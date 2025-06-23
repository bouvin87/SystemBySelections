import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface DeviationUpdatedEmailProps {
  deviation: any;
  changedBy: any;
  type: any;
  baseUrl: string;
}

export const DeviationUpdatedEmail = ({
  deviation,
  changedBy,
  type,
  baseUrl,
}: DeviationUpdatedEmailProps) => {
  const previewText = `Avvikelse uppdaterad: ${deviation.title}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={headerText}>System by Selection</Text>
            <Text style={headerSubtext}>Avvikelsehantering</Text>
          </Section>

          <Section style={content}>
            <Text style={h1}>Avvikelse uppdaterad</Text>
            
            <Section style={deviationCard}>
              <Text style={deviationTitle}>{deviation.title}</Text>
              
              <Text style={metaText}>
                <strong>Typ:</strong> {type.name}
              </Text>
              
              <Text style={metaText}>
                <strong>Beskrivning:</strong> {deviation.description || 'Ingen beskrivning'}
              </Text>
              
              <Text style={metaText}>
                <strong>Uppdaterad av:</strong> {changedBy.firstName} {changedBy.lastName}
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

            <Section style={infoBox}>
              <Text style={infoText}>
                Du får detta meddelande eftersom du är kopplad till denna avvikelse som skapare, tilldelad person eller avdelningsansvarig.
              </Text>
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

export default DeviationUpdatedEmail;

// Enhanced styles
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
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
  color: '#1e293b',
  fontSize: '28px',
  fontWeight: '700',
  margin: '0 0 24px',
  textAlign: 'center' as const,
};

const deviationCard = {
  backgroundColor: '#f8fafc',
  border: '2px solid #e2e8f0',
  borderRadius: '12px',
  padding: '32px',
  margin: '24px 0',
  borderLeft: '6px solid #3b82f6',
};

const deviationTitle = {
  color: '#1e293b',
  fontSize: '20px',
  fontWeight: '700',
  margin: '0 0 20px',
  lineHeight: '1.3',
};

const metaText = {
  color: '#475569',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '12px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '40px 0',
};

const button = {
  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
  boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)',
  transition: 'all 0.2s ease',
};

const infoBox = {
  backgroundColor: '#eff6ff',
  border: '1px solid #bfdbfe',
  borderRadius: '8px',
  padding: '20px',
  margin: '32px 0 0',
};

const infoText = {
  color: '#1e40af',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0',
  textAlign: 'center' as const,
};

const footer = {
  borderTop: '1px solid #e2e8f0',
  color: '#64748b',
  fontSize: '12px',
  lineHeight: '1.5',
  padding: '24px 40px',
  textAlign: 'center' as const,
};

const footerText = {
  margin: '0 0 8px',
};

const unsubscribeLink = {
  color: '#64748b',
  textDecoration: 'underline',
};