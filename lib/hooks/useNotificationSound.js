import { useEffect, useRef } from 'react';

const playNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    const playTone = (freq, startTime, duration) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    // Double ding
    playTone(880, ctx.currentTime, 0.3); // A5
    playTone(1108.73, ctx.currentTime + 0.15, 0.5); // C#6
  } catch (err) {
    console.error('Failed to play notification sound', err);
  }
};

export function useNotificationSound(orders) {
  const prevItemsRef = useRef(new Set());
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!orders) return;

    const currentItems = new Set();
    let shouldPlay = false;

    orders.forEach(order => {
      // New order received
      if (order.status === 'received') {
        currentItems.add(`${order.id}-received`);
        if (!prevItemsRef.current.has(`${order.id}-received`)) {
          shouldPlay = true;
        }
      }
      // Staff assistance requested
      if (order.staff_called) {
        currentItems.add(`${order.id}-staff`);
        if (!prevItemsRef.current.has(`${order.id}-staff`)) {
          shouldPlay = true;
        }
      }
      // Food is ready to serve
      if (order.status === 'ready') {
        currentItems.add(`${order.id}-ready`);
        if (!prevItemsRef.current.has(`${order.id}-ready`)) {
          shouldPlay = true;
        }
      }
      // Bill requested
      if (order.bill_requested && order.payment_status === 'pending') {
        currentItems.add(`${order.id}-bill`);
        if (!prevItemsRef.current.has(`${order.id}-bill`)) {
          shouldPlay = true;
        }
      }
      // Table shift requested
      if (order.shift_requested) {
        currentItems.add(`${order.id}-shift-${order.shift_requested}`);
        if (!prevItemsRef.current.has(`${order.id}-shift-${order.shift_requested}`)) {
          shouldPlay = true;
        }
      }
    });

    if (mountedRef.current && shouldPlay) {
      playNotificationSound();
    }

    prevItemsRef.current = currentItems;
    mountedRef.current = true;
  }, [orders]);
}
