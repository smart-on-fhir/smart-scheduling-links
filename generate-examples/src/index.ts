/* eslint-disable @typescript-eslint/no-explicit-any */
import { Command } from 'commander';
import { randomBytes } from 'crypto';
import fs from 'fs';
import b64url from 'base64-url';

let _resourceId = 0;
const resourceId = () => "" + _resourceId++

const bookingId = () => b64url.encode(randomBytes(4).toString())

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

const schedule = (location: Resource)  => ({
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

const addMinutes = (date: Date, minutes: number): Date  => {
  return new Date(new Date(date).setMinutes(date.getMinutes() + minutes));
}


const VISIT_MINUTES = 20;
const createResources = () => {
  const startDate = new Date("2021-03-01");
  const endDate = new Date("2021-03-31");
  const currentDate = new Date(startDate);

  const schedules = locations.map(l => schedule(l));
  let slots: Resource[] = [];

  while (currentDate <= endDate) {
    console.log("Create", currentDate)
    const clinicOpenTime = addMinutes(currentDate, 8*60);
    let slotsForSchedules = schedules.flatMap(schedule => {
      let ret: Resource[] = []
      for (let i = 0; i < 30; i++) {
        const startTime = addMinutes(clinicOpenTime, i*VISIT_MINUTES);
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
  "request": "https://raw.githubusercontent.com/smart-on-fhir/smart-scheduling-links/master/examples/$bulk-publish",
  "output": [
    {
      "type": "Schedule",
      "url": "https://raw.githubusercontent.com/smart-on-fhir/smart-scheduling-links/master/examples/schedule.ndjson"
    },
    {
      "type": "Location",
      "url": "https://raw.githubusercontent.com/smart-on-fhir/smart-scheduling-links/master/examples/location.ndjson"
    },
    {
      "type": "Slot",
      "url": "https://raw.githubusercontent.com/smart-on-fhir/smart-scheduling-links/master/examples/slot.ndjson"
    }
  ],
  "error": []
}
  return {
    manifest, locations, slots, schedules
  }

}


async function generate(options: { outdir: string }) {
  let resources = createResources();
    const fileSchedule = `schedule.ndjson`;
    const fileSlot = `slot.ndjson`;
    const fileLocation = `location.ndjson`;
    const fileManifest = `$bulk-publish`;

  fs.writeFileSync(`${options.outdir}/${fileSchedule}`, resources.schedules.map(s => JSON.stringify(s)).join("\n"));
  fs.writeFileSync(`${options.outdir}/${fileSlot}`, resources.slots.map(s => JSON.stringify(s)).join("\n"));
  fs.writeFileSync(`${options.outdir}/${fileLocation}`, resources.locations.map(s => JSON.stringify(s)).join("\n"));
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
