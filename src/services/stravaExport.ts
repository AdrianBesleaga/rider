/**
 * Strava Export — Generate .TCX file for Strava upload
 *
 * TCX (Training Center XML) is supported by Strava, Garmin Connect, and most platforms.
 * This generates a minimal valid TCX file from ride data.
 */

import { CyclingData, PowerSample } from '../types';

interface RideData {
    cyclingData: CyclingData;
    powerSamples: PowerSample[];
    startTime: Date;
}

function pad(n: number): string {
    return String(n).padStart(2, '0');
}

function toIso(date: Date): string {
    return date.toISOString();
}

export function generateTcx(ride: RideData): string {
    const { cyclingData, powerSamples, startTime } = ride;
    const endTime = new Date(startTime.getTime() + cyclingData.elapsedTime * 1000);

    // Build trackpoints from power samples
    const trackpoints = powerSamples.map((sample) => {
        const time = new Date(startTime.getTime() + sample.time * 1000);
        return `        <Trackpoint>
          <Time>${toIso(time)}</Time>
          <HeartRateBpm><Value>${cyclingData.heartRate}</Value></HeartRateBpm>
          <Cadence>${cyclingData.cadence}</Cadence>
          <Extensions>
            <ns3:TPX>
              <ns3:Speed>${(cyclingData.speed / 3.6).toFixed(2)}</ns3:Speed>
              <ns3:Watts>${sample.power}</ns3:Watts>
            </ns3:TPX>
          </Extensions>
        </Trackpoint>`;
    });

    const tcx = `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase
  xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2"
  xmlns:ns3="http://www.garmin.com/xmlschemas/ActivityExtension/v2">
  <Activities>
    <Activity Sport="Biking">
      <Id>${toIso(startTime)}</Id>
      <Lap StartTime="${toIso(startTime)}">
        <TotalTimeSeconds>${cyclingData.elapsedTime}</TotalTimeSeconds>
        <DistanceMeters>${cyclingData.distance}</DistanceMeters>
        <Calories>${Math.round(cyclingData.calories)}</Calories>
        <AverageHeartRateBpm><Value>${cyclingData.heartRate}</Value></AverageHeartRateBpm>
        <Cadence>${cyclingData.cadence}</Cadence>
        <TriggerMethod>Manual</TriggerMethod>
        <Track>
${trackpoints.join('\n')}
        </Track>
        <Extensions>
          <ns3:LX>
            <ns3:AvgSpeed>${(cyclingData.speed / 3.6).toFixed(2)}</ns3:AvgSpeed>
            <ns3:AvgWatts>${cyclingData.power}</ns3:AvgWatts>
          </ns3:LX>
        </Extensions>
      </Lap>
      <Creator>
        <Name>Stock Rider</Name>
      </Creator>
    </Activity>
  </Activities>
</TrainingCenterDatabase>`;

    return tcx;
}

export function downloadTcx(ride: RideData): void {
    const tcx = generateTcx(ride);
    const blob = new Blob([tcx], { type: 'application/vnd.garmin.tcx+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = ride.startTime.toISOString().split('T')[0];
    a.href = url;
    a.download = `stock-rider-${dateStr}.tcx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
