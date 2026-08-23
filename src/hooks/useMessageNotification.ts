import { useEffect, useRef } from 'react';
import type { Message } from '@/types';

/**
 * A clean, robust hook for components that need to execute local logic 
 * (like scrolling to the bottom of a list) when a new message arrives.
 * 
 * Note: System sounds and desktop toasts are handled globally by useSocket.ts 
 * to prevent duplicate audio/toast triggers across multiple components.
 */
export const useMessageNotification = (onNewMessage: (message: Message) => void) => {
  // We use a ref to store the callback. This ensures we always call the latest 
  // function without needing to re-bind the window event listener on every render.
  const callbackRef = useRef(onNewMessage);

  useEffect(() => {
    callbackRef.current = onNewMessage;
  }, [onNewMessage]);

  useEffect(() => {
    const handleNewMessageEvent = (event: Event) => {
      // Type-safe extraction of the custom event detail we emit from useSocket
      const customEvent = event as CustomEvent<Message>;
      
      if (customEvent.detail) {
        callbackRef.current(customEvent.detail);
      }
    };

    window.addEventListener('newMessage', handleNewMessageEvent);
    
    return () => {
      window.removeEventListener('newMessage', handleNewMessageEvent);
    };
  }, []);
};