export function createEncounter(onChange) {
  let stage = 'waitingForMessage';
  let elapsed = 0;
  let hiddenTime = 0;

  function advance(next) {
    stage = next;
    elapsed = 0;
    onChange(next);
  }

  return {
    get stage() { return stage; },
    openApp(app) {
      if (app === 'Message' && stage === 'waitingForMessage') advance('messageRead');
      if (app === 'Phonecall' && stage === 'ringing') advance('answered');
    },
    tryDoor() {
      if (stage === 'exploring') return true;
      if (stage !== 'knocking') return false;
      advance('doorOpening');
      return true;
    },
    update(dt, hidden, doorAngle) {
      elapsed += dt;
      if (stage === 'messageRead' && elapsed >= 1.2) advance('ringing');
      if (stage === 'answered' && elapsed >= 2.3) advance('knocking');
      if (stage === 'knocking') {
        hiddenTime = hidden ? hiddenTime + dt : 0;
        if (hiddenTime >= 4) advance('safe');
      }
      if (stage === 'doorOpening' && elapsed >= 1.5 && doorAngle >= .9) advance('caught');
    },
    explore() {
      if (stage === 'safe') advance('exploring');
    }
  };
}

export function createEncounterAudio() {
  let context;

  function tone(at, duration, type, from, to, volume) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(from, at);
    oscillator.frequency.exponentialRampToValueAtTime(to, at + duration);
    gain.gain.setValueAtTime(.0001, at);
    gain.gain.exponentialRampToValueAtTime(volume, at + .02);
    gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(at);
    oscillator.stop(at + duration);
  }

  return {
    enable() {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      try {
        context ??= new Audio();
        context.resume().catch(() => {});
      } catch {}
    },
    play(cue) {
      if (context?.state !== 'running') return;
      const at = context.currentTime + .03;
      if (cue === 'ringing') {
        for (const offset of [0, .22, .95, 1.17]) {
          tone(at + offset, .17, 'sine', 740, 690, .09);
          tone(at + offset, .17, 'triangle', 932, 900, .04);
        }
      } else if (cue === 'knocking') {
        for (const offset of [0, .28, .76]) {
          tone(at + offset, .19, 'triangle', 135, 43, .19);
        }
      } else if (cue === 'safe') {
        for (const [offset, volume] of [[0, .13], [.48, .08], [1.02, .04]]) {
          tone(at + offset, .22, 'triangle', 82, 34, volume);
        }
      } else if (cue === 'doorOpening') {
        tone(at, 1.35, 'triangle', 58, 128, .17);
      } else if (cue === 'caught') {
        tone(at, .45, 'triangle', 185, 37, .24);
      }
    }
  };
}
