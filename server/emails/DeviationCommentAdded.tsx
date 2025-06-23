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

interface DeviationCommentAddedEmailProps {
  deviation: any;
  comment: string;
  commenter: any;
  type: any;
  baseUrl: string;
}

export const DeviationCommentAddedEmail = ({
  deviation,
  comment,
  commenter,
  type,
  baseUrl,
}: DeviationCommentAddedEmailProps) => {
  const previewText = `Ny kommentar på avvikelse: ${deviation.title}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={headerText}>System by Selection</Text>
            <Text style={headerSubtext}>Ny kommentar</Text>
          </Section>

          <Section style={content}>
            <Text style={h1}>Ny kommentar på avvikelse</Text>
            
            <Section style={deviationCard}>
              <Text style={deviationTitle}>{deviation.title}</Text>
              
              <Text style={metaText}>
                <strong>Typ:</strong> {type.name}
              </Text>
              
              <Text style={metaText}>
                <strong>Beskrivning:</strong> {deviation.description || 'Ingen beskrivning'}
              </Text>
              
              {deviation.dueDate && (
                <Text style={metaText}>
                  <strong>Förfallodatum:</strong> {new Date(deviation.dueDate).toLocaleDateString('sv-SE')}
                </Text>
              )}
            </Section>

            <Section style={commentCard}>
              <Text style={commentHeader}>
                <strong>{commenter.firstName} {commenter.lastName}</strong> kommenterade:
              </Text>
              <Text style={commentText}>
                "{comment}"
              </Text>
              <Text style={commentMeta}>
                {new Date().toLocaleString('sv-SE')}
              </Text>
            </Section>

            <Section style={buttonContainer}>
              <Button
                style={button}
                href={`${baseUrl}/deviations/${deviation.id}`}
              >
                Visa avvikelse och kommentarer
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

export default DeviationCommentAddedEmail;

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
  background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
  padding: '32px 40px',
  borderRadius: '12px 12px 0 0',
};

const headerText = {
  color: '#ffffff',
  fontSize: '20px',
  fontWeight: '600',
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

const metaText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '8px 0',
};

const commentCard = {
  backgroundColor: '#eff6ff',
  border: '1px solid #bfdbfe',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
};

const commentHeader = {
  color: '#1e40af',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 12px',
};

const commentText = {
  color: '#1f2937',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '12px 0',
  fontStyle: 'italic',
  borderLeft: '3px solid #3b82f6',
  paddingLeft: '16px',
};

const commentMeta = {
  color: '#6b7280',
  fontSize: '12px',
  margin: '12px 0 0',
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