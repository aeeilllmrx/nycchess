"use client";

import { useEffect, useRef } from 'react';

export function PayPalButton({ tournamentId }) {
  const buttonRef = useRef(null);
  const buttonRendered = useRef(false);

  useEffect(() => {
    if (!buttonRef.current || buttonRendered.current || !window.paypal) return;

    try {
      window.paypal.HostedButtons({
        hostedButtonId: "PNKTLCPRKPPVC"
      }).render(`#paypal-container-${tournamentId}`);
      
      buttonRendered.current = true;
    } catch (error) {
      console.error('Failed to render PayPal button:', error);
    }
  }, [tournamentId]);

  return (
    <div 
      id={`paypal-container-${tournamentId}`}
      ref={buttonRef}
      className="mt-4"
    />
  );
}