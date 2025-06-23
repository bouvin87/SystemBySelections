import { Section, Text } from "@react-email/components";
import * as React from "react";
import { emailStyles as styles } from "./EmailStyles";

export const DeviationInfoBox = () => {
  return (
    <Section style={styles.infoBox}>
      <Text style={styles.infoText}>
        Du får detta meddelande eftersom du är kopplad till denna avvikelse som
        skapare, tilldelad person eller avdelningsansvarig.
      </Text>
    </Section>
  );
};

export default DeviationInfoBox;
