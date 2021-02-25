/* eslint-disable @typescript-eslint/no-explicit-any */
import { Command } from 'commander';
import { randomBytes } from 'crypto';
import fs from 'fs';
import b64url from 'base64-url';
import _ from 'lodash';

const BASE_URL = "https://raw.githubusercontent.com/smart-on-fhir/smart-scheduling-links/master/examples/";
const MAX_LOCATIONS_PER_FILE = 200

const VISIT_MINUTES = 20;

let _resourceId = 0;
const resourceId = () => "" + _resourceId++

const bookingId = () => b64url.encode(randomBytes(4).toString())

const getWeek = function(d: Date) {
  var date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  var week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000
   - 3 + (week1.getDay() + 6) % 7) / 7);
}

const slot = (start: string, end: string, schedule: Resource) => ({
  "resourceType": "Slot",
  "id": resourceId(),
  "schedule": {
    "reference": `Schedule/${schedule.id}`
  },
  "status": "free",
  "start": start,
  "end": end,
  "extension": [{
    "url": "http://fhir-registry.smarthealthit.org/StructureDefinition/booking-deep-link",
    "valueUrl": `https://ehr-portal.example.org/bookings?slot=${bookingId()}`
  }]
})

const schedule = (location: Resource) => ({
  "resourceType": "Schedule",
  "id": resourceId(),
  "serviceType": [
    {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/service-type",
          "code": "57",
          "display": "Immunization"
        },
        {
          "system": "http://fhir-registry.smarthealthit.org/CodeSystem/service-type",
          "code": "covid19-immunization",
          "display": "COVID-19 Immunization Appointment"
        }
      ]
    }
  ],
  "actor": [
    {
      "reference": `Location/${location.id}`
    }
  ]
})

interface Resource {
  resourceType: string,
  id: string,
  [key: string]: any
}
const locations: Resource[] = [{
  "resourceType": "Location",
  "id": resourceId(),
  "name": "Example Vaccine Clinic",
  "description": "Located behind old bank building",
  "telecom": [{
    "system": "phone",
    "value": "000-000-0000"
  }],
  "address": {
    "line": ["000 Elm St"],
    "city": "Anyfield",
    "state": "MA",
    "postalCode": "00000-0000"
  }
}];

const addMinutes = (date: Date, minutes: number): Date => {
  return new Date(new Date(date).setMinutes(date.getMinutes() + minutes));
}


const createResources = () => {
  const startDate = new Date("2021-03-01T00:00-05:00",);
  const endDate = new Date("2021-03-31");
  const currentDate = new Date(startDate);

  const schedules = locations.map(l => schedule(l));
  let slots: Resource[] = [];

  while (currentDate <= endDate) {
    const clinicOpenTime = addMinutes(currentDate, 8 * 60);
    let slotsForSchedules = schedules.flatMap(schedule => {
      let ret: Resource[] = []
      for (let i = 0; i < 30; i++) {
        const startTime = addMinutes(clinicOpenTime, i * VISIT_MINUTES);
        const endTime = addMinutes(startTime, VISIT_MINUTES);
        ret.push(slot(startTime.toISOString(), endTime.toISOString(), schedule))
      }
      return ret;
    })
    slots = [...slots, ...slotsForSchedules];
    currentDate.setDate(currentDate.getDate() + 1)
  }
  const manifest = {
    "transactionTime": new Date().toISOString(),
    "request": `${BASE_URL}$bulk-publish`,
    "output": [
      {
        "type": "Location",
        "url": `${BASE_URL}locations.ndjson`
      },
      {
        "type": "Schedule",
        "url": `${BASE_URL}schedules.ndjson`
      },
    ],
    "error": []
  }
  return {
    manifest, locations, slots, schedules
  }
}


async function generate(options: { outdir: string }) {
  let resources = createResources();
  const fileLocation = `locations.ndjson`;
  const fileSchedule = `schedules.ndjson`;
  const fileSlot = (i: string) => `slots-${i}.ndjson`;
  const fileManifest = `$bulk-publish`;

  fs.writeFileSync(`${options.outdir}/${fileLocation}`, resources.locations.map(s => JSON.stringify(s)).join("\n"));
  fs.writeFileSync(`${options.outdir}/${fileSchedule}`, resources.schedules.map(s => JSON.stringify(s)).join("\n"));


  const slotsSplitMap = _.chain(resources.slots as unknown as {start: string}[])
    .groupBy(s => s.start.slice(0, 4) + "-W" + String(getWeek(new Date(s.start))).padStart(2, "0"))
    .value();

  Object.entries(slotsSplitMap).forEach(([week, slots], i) => {
    fs.writeFileSync(`${options.outdir}/${fileSlot(week)}`, slots.map(s => JSON.stringify(s)).join("\n"));

  })

  resources.manifest.output = [...resources.manifest.output, ...(Object.entries(slotsSplitMap).map(([week, _]) => ({
    type: "Slot",
    url: `${BASE_URL}${fileSlot(week)}`
  })))]

  fs.writeFileSync(`${options.outdir}/${fileManifest}`, JSON.stringify(resources.manifest, null, 2));
}

const program = new Command();
program.option('-o, --outdir <outdir>', 'output directory');
program.parse(process.argv);

interface Options {
  outdir: string;
}

const options = program.opts() as Options;
console.log('Opts', options);

if (options.outdir) {
  generate(options);
}
