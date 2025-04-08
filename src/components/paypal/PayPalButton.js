"use client";

import { useEffect, useRef, useState } from 'react';

export function PayPalButton({ tournamentId, amount, name }) {
  const buttonRef = useRef(null);
  const buttonRendered = useRef(false);
  const [status, setStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!buttonRef.current || buttonRendered.current || !window.paypal) return;

    try {
      window.paypal.Buttons({
        style: {
          size: 'small',
          height: 35,
          tagline: false,
        },
        createOrder: (data, actions) => {
          return actions.order.create({
            purchase_units: [{
              amount: {
                value: amount,
                currency_code: 'USD'
              },
              description: name || `Tournament Registration: ${tournamentId}`
            }]
          });
        },

        onApprove: (data, actions) => {
          return actions.order.capture().then(function() {
            setStatus('success');
            setErrorMessage('');
          });
        },

        onError: (err) => {
          console.error('PayPal payment failed:', err);
          setStatus('error');
          setErrorMessage('Payment failed. Please try again or contact support.');
        }
      }).render(`#paypal-container-${tournamentId}`);
      
      buttonRendered.current = true;
    } catch (error) {
      console.error('Failed to render PayPal button:', error);
      setStatus('error');
      setErrorMessage('Failed to load payment system. Please refresh the page.');
    }
  }, [tournamentId, amount, name]);

  return (
    <div className="max-w-[300px]">
      <div
        id={`paypal-container-${tournamentId}`}
        ref={buttonRef}
        className="mt-4"
      />
      {status === 'success' && (
        <p className="mt-2 text-sm text-green-600">
          Payment successful! Thank you for registering.
        </p>
      )}
      {status === 'error' && (
        <p className="mt-2 text-sm text-red-600">
          {errorMessage}
        </p>
      )}
    </div>
  );
}