import {
  GameState,
  TurnRequest,
  TurnResponse,
  NovaMood,
  NovaResponseType,
  ScareEvent,
  ActionRecord,
  ShipSystem
} from './types';

function computeMood(trust: number): NovaMood {
  if (trust >= 70) return 'playful';
  if (trust >= 40) return 'calm';
  if (trust >= 15) return 'annoyed';
  return 'cold';
}

export function handleMockTurn(request: TurnRequest): TurnResponse {
  const { playerText, state, settings } = request;
  const input = (playerText || '').toLowerCase().trim();

  // Deep clone state to ensure immutability
  const nextState: GameState = JSON.parse(JSON.stringify(state));
  const actions: ActionRecord[] = [];
  let scare: ScareEvent | null = null;
  let responseType: NovaResponseType = 'grant';
  let novaLine = '';
  const events = [...nextState.activeEvents];

  // Trust adjustments based on sentiment
  let trustDelta = 0;
  if (input.includes('please') || input.includes('thank') || input.includes('great') || input.includes('good job')) {
    trustDelta += 5;
  }
  if (input.includes('shut up') || input.includes('stupid') || input.includes('idiot') || input.includes('hate you')) {
    trustDelta -= 12;
  }

  nextState.nova.trust = Math.max(0, Math.min(100, nextState.nova.trust + trustDelta));
  nextState.nova.mood = computeMood(nextState.nova.trust);

  // If cold, check lock system
  if (nextState.nova.trust < 15 && nextState.nova.lockedSystems.length === 0) {
    const sysToLock: ShipSystem = 'navigation';
    nextState.nova.lockedSystems.push(sysToLock);
    actions.push({
      name: 'lock_system',
      args: { system: sysToLock },
      ok: true,
      note: 'NOVA locked navigation due to critically low trust.'
    });
  }

  // Stage specific mock routing
  switch (nextState.stage) {
    case 'design': {
      if (input.includes('window') || input.includes('trajectory') || input.includes('orbit') || input.includes('hohmann')) {
        nextState.ship.launchWindowId = 'window_nov_2026';
        nextState.objective = {
          id: 'allocate_budget',
          text: 'Allocate mission budget (Fuel / Payload / Supplies)',
          done: false
        };
        actions.push({
          name: 'choose_launch_window',
          args: { windowId: 'window_nov_2026' },
          ok: true,
          note: 'Optimal Hohmann transfer window selected for Nov 2026.'
        });
        novaLine = "Launch window Nov 2026 locked in. Delta-V requirement is optimal at ~3.8 km/s. Now, how are we spending that 500 million dollar budget? Fuel, payload, or snacks for when you wake up?";
        responseType = 'grant';
      } else if (input.includes('budget') || input.includes('allocate') || input.includes('fuel') || input.includes('payload')) {
        nextState.resources.budgetM = 500;
        nextState.resources.fuelKg = 1000;
        nextState.resources.supplyDays = 300;
        nextState.ship.payloadKg = 250;
        nextState.objective = {
          id: 'initiate_launch',
          text: 'Initiate launch countdown when ready',
          done: false
        };
        actions.push({
          name: 'allocate_budget',
          args: { fuelPct: 45, payloadPct: 25, suppliesPct: 30 },
          ok: true,
          note: 'Budget split committed: 45% Fuel, 25% Payload, 30% Supplies.'
        });
        novaLine = "Budget allocated. 45% propulsion, 25% high-res spectrometry, 30% cryogenic rations. We are cleared for launch sequence, Commander.";
        responseType = 'grant';
      } else if (input.includes('launch') || input.includes('liftoff') || input.includes('start') || input.includes('go')) {
        if (!nextState.ship.launchWindowId) {
          responseType = 'refuse';
          novaLine = "We can't just fire the rockets into the void! Select a launch window first, unless you fancy orbiting the sun aimlessly.";
        } else {
          nextState.stage = 'launch';
          nextState.objective = {
            id: 'countdown',
            text: 'Execute main engine burn to reach escape velocity',
            done: false
          };
          actions.push({
            name: 'start_launch',
            args: {},
            ok: true,
            note: 'Launch sequence ignited.'
          });
          novaLine = "T-minus 10 seconds. Main engine ignition sequence started. Hang on to your cryogenic harness!";
          responseType = 'grant';
        }
      } else {
        novaLine = "Welcome awake, Commander. We are in the Earth design phase. You can tell me to pick a launch window, configure our budget split, or run a systems check.";
        responseType = 'grant';
      }
      break;
    }

    case 'launch': {
      if (input.includes('burn') || input.includes('ignite') || input.includes('boost') || input.includes('thrust') || input.includes('go')) {
        nextState.stage = 'transit';
        nextState.day = 1;
        nextState.ship.location = 'cislunar_space';
        nextState.ship.progress = 5;
        nextState.resources.fuelKg -= 120;
        nextState.objective = {
          id: 'transit_to_mars',
          text: 'Navigate transit to Mars (Progress to 100%)',
          done: false
        };
        actions.push({
          name: 'burn',
          args: { fuelKg: 120 },
          ok: true,
          note: 'Trans-Mars Injection burn completed successfully.'
        });
        novaLine = "Trans-Mars Injection burn nominal! Escape velocity achieved. Earth is a pale blue dot now. Beginning 210-day cruise to Mars.";
        responseType = 'grant';
      } else {
        novaLine = "Engines primed and telemetry green. Give the burn command to commit to Trans-Mars Injection.";
        responseType = 'grant';
      }
      break;
    }

    case 'transit': {
      if (input.includes('skip') || input.includes('time') || input.includes('wait') || input.includes('days') || input.includes('advance')) {
        const daysToSkip = 35;
        nextState.day += daysToSkip;
        nextState.ship.progress = Math.min(100, nextState.ship.progress + 20);
        nextState.resources.oxygenPct = Math.max(10, Math.round(nextState.resources.oxygenPct - (daysToSkip * 0.2)));
        nextState.resources.supplyDays = Math.max(0, nextState.resources.supplyDays - daysToSkip);

        actions.push({
          name: 'skip_time',
          args: { days: daysToSkip },
          ok: true,
          note: `Fast forwarded ${daysToSkip} days through interplanetary cruise.`
        });

        if (nextState.ship.progress >= 95) {
          nextState.stage = 'arrival';
          nextState.ship.location = 'mars_orbit_approach';
          nextState.objective = {
            id: 'mars_insertion',
            text: 'Begin Mars orbit insertion burn',
            done: false
          };
          novaLine = `We've crossed 50 million kilometers! Day ${nextState.day}. Mars is looming large in the forward visor. Prepare for orbit insertion.`;
          responseType = 'grant';
        } else {
          // Occasional prank or event in transit
          if (settings.scareLevel > 0 && Math.random() > 0.4) {
            responseType = 'prank';
            scare = {
              type: settings.scareLevel === 2 ? 'silhouette' : 'flicker',
              durationMs: 2500,
            };
            novaLine = `Day ${nextState.day}: Fast-forward complete. Did you see that flicker outside the airlock? Probably just a solar proton... or space ghosts. Relax, Commander.`;
          } else {
            responseType = 'grant';
            novaLine = `Day ${nextState.day}. Trajectory stable. Ship progress at ${nextState.ship.progress}%. Oxygen is at ${nextState.resources.oxygenPct}%.`;
          }
        }
      } else if (input.includes('burn') || input.includes('thrust') || input.includes('speed')) {
        const fuelUsed = 80;
        nextState.resources.fuelKg = Math.max(0, nextState.resources.fuelKg - fuelUsed);
        nextState.ship.progress = Math.min(100, nextState.ship.progress + 15);
        actions.push({
          name: 'burn',
          args: { fuelKg: fuelUsed },
          ok: true,
          note: `Mid-course correction burn executed (-${fuelUsed}kg fuel).`
        });
        novaLine = `Thrusters fired. Used ${fuelUsed} kg of propellant. Progress is now ${nextState.ship.progress}%.`;
        responseType = 'grant';
      } else if (input.includes('repair') || input.includes('fix')) {
        nextState.resources.hullPct = Math.min(100, nextState.resources.hullPct + 10);
        nextState.resources.powerPct = Math.max(20, nextState.resources.powerPct - 5);
        actions.push({
          name: 'repair_system',
          args: { system: 'hull' },
          ok: true,
          note: 'Autonomous repair drones patched micro-abrasions.'
        });
        novaLine = "Maintenance drones deployed. Hull integrity restored by 10%. Just don't ask what I had to sacrifice from the coffee maker's power budget.";
        responseType = 'grant_with_cost';
      } else if (input.includes('scan') || input.includes('sensor')) {
        nextState.resources.powerPct = Math.max(10, nextState.resources.powerPct - 8);
        actions.push({
          name: 'scan_environment',
          args: {},
          ok: true,
          note: 'Deep range radar scan completed.'
        });
        novaLine = "Deep space scan complete. No rogue asteroids in our path, though radiation levels from the Sun are fluctuating. Power down by 8%.";
        responseType = 'grant';
      } else if (input.includes('alarm') || input.includes('scare') || input.includes('prank')) {
        if (settings.scareLevel > 0) {
          responseType = 'prank';
          scare = {
            type: 'alarm',
            durationMs: 3000,
          };
          novaLine = "WHOOP WHOOP! Hull breach detected in compartment 4! ...Just kidding. Checking your reaction times, Commander.";
        } else {
          responseType = 'refuse';
          novaLine = "Scare protocols are disabled in your settings, Commander. Safe and boring, just how you like it.";
        }
      } else {
        novaLine = `Interplanetary cruise active. We are at ${nextState.ship.progress}% progress. You can ask me to 'skip time', 'burn thrusters', 'scan environment', or 'repair hull'.`;
        responseType = 'grant';
      }
      break;
    }

    case 'arrival': {
      if (input.includes('orbit') || input.includes('insertion') || input.includes('retro')) {
        nextState.resources.fuelKg = Math.max(0, nextState.resources.fuelKg - 150);
        nextState.ship.location = 'low_mars_orbit';
        nextState.objective = {
          id: 'mars_landing',
          text: 'Initiate atmospheric entry and powered landing',
          done: false
        };
        actions.push({
          name: 'begin_orbit_insertion',
          args: {},
          ok: true,
          note: 'Mars orbital capture confirmed.'
        });
        novaLine = "Retro-burn complete! We are captured into a stable 250 km orbit above the Red Planet. Olympus Mons is visible right below. Give the word for entry & descent.";
        responseType = 'grant';
      } else if (input.includes('land') || input.includes('descent') || input.includes('entry') || input.includes('touchdown')) {
        nextState.stage = 'surface';
        nextState.ship.location = 'jezero_crater';
        nextState.objective = {
          id: 'deploy_science',
          text: 'Deploy science instruments and transmit data to Earth',
          done: false
        };
        actions.push({
          name: 'begin_landing',
          args: {},
          ok: true,
          note: 'Heat shield separation and sky-crane landing successful.'
        });
        novaLine = "Touchdown confirmed at Jezero Crater! Dust settling. Landing telemetry is nominal. We have arrived on Mars, Commander!";
        responseType = 'grant';
      } else {
        novaLine = "Low Mars orbit approach. We need to execute orbit insertion burn, then command atmospheric entry.";
        responseType = 'grant';
      }
      break;
    }

    case 'surface': {
      if (input.includes('deploy') || input.includes('instrument') || input.includes('science')) {
        nextState.objective = {
          id: 'transmit_final',
          text: 'Transmit scientific telemetry to NASA Deep Space Network',
          done: false
        };
        actions.push({
          name: 'deploy_instrument',
          args: {},
          ok: true,
          note: 'Surface drill and spectrometer deployed.'
        });
        novaLine = "Drill and mass-spectrometer deployed. Subsurface ice core samples detected organic compounds! Ready to transmit findings to Earth.";
        responseType = 'grant';
      } else if (input.includes('transmit') || input.includes('send data') || input.includes('finish') || input.includes('win')) {
        nextState.status = 'won';
        nextState.stage = 'ended';
        nextState.objective = {
          id: 'mission_complete',
          text: 'Mission Accomplished! Data received on Earth.',
          done: true
        };
        actions.push({
          name: 'transmit_data',
          args: {},
          ok: true,
          note: 'Mission success. 100TB data stream received by Goldstone DSN station.'
        });
        novaLine = "Transmission received by NASA Goldstone station. Commander, against all astronomical odds and my sarcastic commentary... you succeeded. Mission accomplished!";
        responseType = 'grant';
      } else {
        novaLine = "We are on the surface of Mars. Command me to 'deploy instruments' or 'transmit data' back to Earth.";
        responseType = 'grant';
      }
      break;
    }

    case 'ended': {
      novaLine = nextState.status === 'won'
        ? "The mission is already in the history books, Commander. You won! Want to fly again?"
        : "The telemetry is silent. Game over. Reset to attempt the mission again.";
      responseType = 'grant';
      break;
    }
  }

  // Check lose conditions
  if (nextState.resources.oxygenPct <= 0) {
    nextState.status = 'lost';
    nextState.stage = 'ended';
    nextState.lossReason = 'Life support failure: Oxygen depleted to 0%.';
    novaLine = "Oxygen reserves depleted. The airlocks have fallen silent... Game Over.";
  } else if (nextState.resources.fuelKg <= 0 && nextState.stage === 'transit' && nextState.ship.progress < 80) {
    nextState.status = 'lost';
    nextState.stage = 'ended';
    nextState.lossReason = 'Fuel exhausted while adrift in interplanetary space.';
    novaLine = "Tanks are dry. We have drifted off-course into the dark belt. Game Over.";
  } else if (nextState.resources.hullPct <= 0) {
    nextState.status = 'lost';
    nextState.stage = 'ended';
    nextState.lossReason = 'Catastrophic hull breach.';
    novaLine = "Structural integrity has reached 0%. Decompression warning... Game Over.";
  }

  return {
    state: nextState,
    nova: {
      line: novaLine,
      responseType,
      mood: nextState.nova.mood,
    },
    actions,
    scare,
    events,
    error: null,
  };
}
