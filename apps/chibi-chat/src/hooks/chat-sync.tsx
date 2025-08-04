import { findNextMessage, getMessage, type Message } from '@/lib/messages';
import { useEffect, useState } from 'react';
import YouTube, { type YouTubePlayer } from 'react-youtube';

interface Status {
  i: number;
  timeMs: number;
  messages: Message[];
}

const TICK_MS = 500;

export function useChat(playerState: number, player?: YouTubePlayer) {
  const [status, setStatus] = useState<Status>({
    i: 0,
    timeMs: 0,
    messages: [] as Message[],
  });

  useEffect(() => {
    async function tick() {
      const newTimeMs = 1000 * ((await player?.getCurrentTime()) ?? 0);
      setStatus((prevStatus) => calcNewStatus({ newTimeMs, prevStatus }));
    }

    // Setup scheduler (to process messages every 100ms)
    if (!player || playerState !== YouTube.PlayerState.PLAYING) {
      return;
    }

    const id = setInterval(() => {
      void tick();
    }, TICK_MS);
    return () => {
      clearInterval(id);
    };
  }, [player, playerState]);

  return status.messages;
}

const calcNewStatus = ({
  newTimeMs,
  prevStatus,
}: {
  newTimeMs: number;
  prevStatus: Status;
}) => {
  const { i, timeMs, messages } = prevStatus;
  if (timeMs > newTimeMs || timeMs + 5000 < newTimeMs) {
    return {
      i: findNextMessage(newTimeMs),
      timeMs: newTimeMs,
      messages: [],
    };
  }

  let curr = i;
  const newMessages: Message[] = [];
  while (true) {
    const message = getMessage(curr);
    if (message.offsetMilli <= newTimeMs) {
      newMessages.push(message);
      curr++;
    } else {
      break;
    }
  }
  return {
    i: curr,
    timeMs: newTimeMs,
    messages: [...messages, ...newMessages].slice(-20),
  };
};
