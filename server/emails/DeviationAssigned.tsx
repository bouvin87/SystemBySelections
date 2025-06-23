import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
} from '@react-email/components';
import * as React from 'react';

interface DeviationAssignedEmailProps {
  deviation: {
    id: number;
    title: string;
    description?: string;
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
  baseUrl?: string;
}

export const DeviationAssignedEmail = ({
  deviation,
  assignedUser,
  assigner,
  type,
  baseUrl = 'http://localhost:5000',
}: DeviationAssignedEmailProps) => {
  const previewText = `Du har tilldelats avvikelse: ${deviation.title}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={headerText}>System by Selection</Text>
          </Section>
          
          <Section style={content}>
            <Heading style={h1}>Du har tilldelats en avvikelse</Heading>
            
            <Text style={greeting}>
              Hej {assignedUser.firstName},
            </Text>
            
            <Section style={deviationCard}>
              <div style={typeIndicator}>
                <div 
                  style={{
                    ...typeDot,
                    backgroundColor: type.color,
                  }}
                />
                <Text style={typeText}>{type.name}</Text>
              </div>
              
              <Heading style={deviationTitle}>{deviation.title}</Heading>
              
              {deviation.description && (
                <Section style={descriptionSection}>
                  <Text style={descriptionLabel}>Beskrivning:</Text>
                  <Text style={descriptionText}>{deviation.description}</Text>
                </Section>
              )}
              
              <Text style={assignerText}>
                <strong>Tilldelad av:</strong> {assigner.firstName} {assigner.lastName}
              </Text>
            </Section>
            
            <Section style={buttonSection}>
              <Button
                style={button}
                href={`${baseUrl}/deviations/${deviation.id}`}
              >
                Hantera avvikelse
              </Button>
            </Section>
            
            <Hr style={hr} />
            
            <Section style={footer}>
              <Text style={footerText}>
                Detta är en automatisk notifiering från avvikelsesystemet.
              </Text>
              <Text style={footerText}>
                System by Selection - Kvalitets- och avvikelsehantering
              </Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  backgroundColor: '#16a34a',
  padding: '20px 40px',
};

const headerText = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
  textAlign: 'center' as const,
};

const content = {
  padding: '40px',
};

const h1 = {
  color: '#1f2937',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 20px',
  textAlign: 'center' as const,
};

const greeting = {
  color: '#374151',
  fontSize: '16px',
  margin: '0 0 24px',
};

const deviationCard = {
  backgroundColor: '#f0f9ff',
  border: '1px solid #0ea5e9',
  borderRadius: '8px',
  padding: '24px',
  margin: '20px 0',
};

const typeIndicator = {
  display: 'flex',
  alignItems: 'center',
  marginBottom: '16px',
};

const typeDot = {
  width: '12px',
  height: '12px',
  borderRadius: '50%',
  marginRight: '8px',
  display: 'inline-block',
};

const typeText = {
  color: '#0369a1',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0',
};

const deviationTitle = {
  color: '#111827',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 16px',
  lineHeight: '1.4',
};

const descriptionSection = {
  margin: '16px 0',
  padding: '16px',
  backgroundColor: '#ffffff',
  borderRadius: '6px',
  border: '1px solid #e0e7ff',
};

const descriptionLabel = {
  color: '#374151',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 8px',
};

const descriptionText = {
  color: '#4b5563',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0',
};

const assignerText = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '16px 0 0',
};

const buttonSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#16a34a',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  border: 'none',
  cursor: 'pointer',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '32px 0',
};

const footer = {
  textAlign: 'center' as const,
};

const footerText = {
  color: '#9ca3af',
  fontSize: '12px',
  margin: '8px 0',
};