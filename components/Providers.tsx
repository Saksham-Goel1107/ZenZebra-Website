'use client';

import { LazyMotion, domAnimation } from 'framer-motion';
import { useEffect } from 'react';
import { ThemeProvider } from './theme-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const warningTitle = "Stop!";
    const warningMessage = "This is a browser feature intended for developers. If someone told you to copy-paste something here to enable a feature or 'hack' someone's account, it is a scam and will give them access to your ZenZebra account.";

    console.log(
      `%c${warningTitle}`,
      "color: #CC2224; font-family: system-ui; font-size: 50px; font-weight: bold; text-shadow: 1px 1px 0px #000; -webkit-text-stroke: 1px #000;"
    );
    console.log(
      `%c${warningMessage}`,
      "color: #000; font-family: system-ui; font-size: 16px; font-weight: 500; line-height: 1.5;"
    );
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <LazyMotion features={domAnimation}>{children}</LazyMotion>
    </ThemeProvider>
  );
}
